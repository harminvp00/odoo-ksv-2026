import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { activityService } from '../services/activity.service';

export const approvalController = {
  initiateApproval: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rfqId, quotationId, approverIds } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'User session not authenticated' });
      }

      // Check if RFQ exists
      const rfq = await prisma.rFQ.findUnique({ where: { id: rfqId } });
      if (!rfq) {
        return res.status(404).json({ message: 'RFQ not found' });
      }

      // Check if Quotation exists
      const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
      if (!quotation) {
        return res.status(404).json({ message: 'Quotation not found' });
      }

      // Check if approval already initiated for this quotation
      const existingApproval = await prisma.approval.findFirst({
        where: { quotationId }
      });
      if (existingApproval) {
        return res.status(400).json({ message: 'Approval workflow already initiated for this quotation' });
      }

      let officerId: string;
      let managerId: string;
      let officerRole: any = 'PROCUREMENT_OFFICER';
      let managerRole: any = 'MANAGER';

      if (approverIds && approverIds.length >= 2) {
        officerId = approverIds[0];
        managerId = approverIds[1];
        
        const approverUsers = await prisma.user.findMany({
          where: { id: { in: [officerId, managerId] } }
        });
        const officerUserRec = approverUsers.find(u => u.id === officerId);
        const managerUserRec = approverUsers.find(u => u.id === managerId);

        if (!officerUserRec || !managerUserRec) {
          return res.status(404).json({ message: 'One or more specified approver users not found' });
        }
        officerRole = officerUserRec.role;
        managerRole = managerUserRec.role;
      } else {
        // Find step 1 approver (e.g. procurement officer) and step 2 approver (manager)
        const officer = await prisma.user.findFirst({
          where: { role: 'PROCUREMENT_OFFICER' }
        });
        const manager = await prisma.user.findFirst({
          where: { role: 'MANAGER' }
        });

        if (!officer || !manager) {
          return res.status(400).json({ message: 'Approval workflow requires at least one Procurement Officer and one Manager in the database' });
        }
        officerId = officer.id;
        managerId = manager.id;
      }

      // Create the approval and chain in a transaction
      const approval = await prisma.$transaction(async (tx) => {
        const createdApproval = await tx.approval.create({
          data: {
            rfqId,
            quotationId,
            currentStep: 'L1_Review',
            status: 'PENDING'
          }
        });

        // Step 1: L1 Review by Officer
        await tx.approvalChain.create({
          data: {
            approvalId: createdApproval.id,
            userId: officerId,
            role: officerRole,
            status: 'PENDING',
            stepNumber: 1
          }
        });

        // Step 2: L2 Approval by Manager
        await tx.approvalChain.create({
          data: {
            approvalId: createdApproval.id,
            userId: managerId,
            role: managerRole,
            status: 'PENDING',
            stepNumber: 2
          }
        });

        return tx.approval.findUnique({
          where: { id: createdApproval.id },
          include: {
            chain: {
              include: {
                user: {
                  select: { id: true, email: true, firstName: true, lastName: true, role: true }
                }
              },
              orderBy: { stepNumber: 'asc' }
            },
            rfq: true,
            quotation: true
          }
        });
      });

      if (approval) {
        // Log Activity
        await activityService.logActivity(
          userId,
          'APPROVAL',
          `Approval workflow initiated for Quotation against RFQ "${rfq.title}"`,
          { approvalId: approval.id, rfqId }
        );

        // Notify L1 Approver
        await activityService.createNotification(
          officerId,
          'APPROVAL',
          'Approval Action Required',
          `An approval workflow has been initiated for Quotation against RFQ "${rfq.title}". Your action is required.`,
          true
        );
      }

      res.status(201).json(approval);
    } catch (err) {
      next(err);
    }
  },

  getWorkflow: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const approval = await prisma.approval.findUnique({
        where: { id },
        include: {
          chain: {
            include: {
              user: {
                select: { id: true, email: true, firstName: true, lastName: true, role: true }
              }
            },
            orderBy: { stepNumber: 'asc' }
          },
          rfq: true,
          quotation: {
            include: {
              vendor: {
                select: { id: true, name: true, rating: true }
              }
            }
          }
        }
      });

      if (!approval) {
        return res.status(404).json({ message: 'Approval workflow not found' });
      }

      res.json(approval);
    } catch (err) {
      next(err);
    }
  },

  actionApproval: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { action, remarks } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'User session not authenticated' });
      }

      if (action !== 'APPROVE' && action !== 'REJECT') {
        return res.status(400).json({ message: 'Invalid action. Must be APPROVE or REJECT' });
      }

      // Fetch approval and current chain
      const approval = await prisma.approval.findUnique({
        where: { id },
        include: {
          chain: {
            orderBy: { stepNumber: 'asc' }
          },
          quotation: true
        }
      });

      if (!approval) {
        return res.status(404).json({ message: 'Approval workflow not found' });
      }

      if (approval.status !== 'PENDING') {
        return res.status(400).json({ message: `Approval workflow has already been completed with status: ${approval.status}` });
      }

      // Find the active pending step
      const activeStep = approval.chain.find(step => step.status === 'PENDING');
      if (!activeStep) {
        return res.status(400).json({ message: 'No active pending step found in approval chain' });
      }

      // Authorization check: Make sure user is the assigned approver (or ADMIN)
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ message: 'User profile not found' });
      }

      if (activeStep.userId !== userId && user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'You are not the assigned approver for the current step' });
      }

      // Execute action inside database transaction
      const updatedApproval = await prisma.$transaction(async (tx) => {
        // Update active step status and remarks
        await tx.approvalChain.update({
          where: { id: activeStep.id },
          data: {
            status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
            remarks: remarks || null,
            actionDate: new Date()
          }
        });

        if (action === 'REJECT') {
          // Reject entire workflow
          const rejectedApproval = await tx.approval.update({
            where: { id },
            data: { status: 'REJECTED' },
            include: {
              chain: {
                include: {
                  user: {
                    select: { id: true, email: true, firstName: true, lastName: true, role: true }
                  }
                },
                orderBy: { stepNumber: 'asc' }
              }
            }
          });

          // Mark quotation as REJECTED
          await tx.quotation.update({
            where: { id: approval.quotationId },
            data: { status: 'REJECTED' }
          });

          return rejectedApproval;
        }

        // If Approved, check if there's a next step
        const nextStep = approval.chain.find(step => step.stepNumber === activeStep.stepNumber + 1);

        if (nextStep) {
          // Advance current step to next step name
          const nextStepName = nextStep.role === 'MANAGER' ? 'L2_Approval' : `Step_${nextStep.stepNumber}`;
          return tx.approval.update({
            where: { id },
            data: { currentStep: nextStepName },
            include: {
              chain: {
                include: {
                  user: {
                    select: { id: true, email: true, firstName: true, lastName: true, role: true }
                  }
                },
                orderBy: { stepNumber: 'asc' }
              }
            }
          });
        } else {
          // No more steps: Final Approval!
          const approvedApproval = await tx.approval.update({
            where: { id },
            data: {
              status: 'APPROVED',
              currentStep: 'Completed'
            },
            include: {
              chain: {
                include: {
                  user: {
                    select: { id: true, email: true, firstName: true, lastName: true, role: true }
                  }
                },
                orderBy: { stepNumber: 'asc' }
              }
            }
          });

          // 1. Select the quotation
          await tx.quotation.update({
            where: { id: approval.quotationId },
            data: { status: 'SELECTED' }
          });

          // 2. Reject all OTHER quotations for this RFQ
          await tx.quotation.updateMany({
            where: {
              rfqId: approval.rfqId,
              id: { not: approval.quotationId }
            },
            data: { status: 'REJECTED' }
          });

          // 3. Close the RFQ
          await tx.rFQ.update({
            where: { id: approval.rfqId },
            data: { status: 'CLOSED' }
          });

          // 4. Auto-generate the Purchase Order (PO-YYYY-XXXX)
          const currentYear = new Date().getFullYear();
          const poCount = await tx.purchaseOrder.count();
          const nextPoNumber = `PO-${currentYear}-${String(poCount + 1).padStart(4, '0')}`;

          await tx.purchaseOrder.create({
            data: {
              poNumber: nextPoNumber,
              rfqId: approval.rfqId,
              quotationId: approval.quotationId,
              vendorId: approval.quotation.vendorId,
              status: 'DRAFT',
              createdByUserId: userId
            }
          });

          return approvedApproval;
        }
      });

      if (updatedApproval) {
        // Fetch RFQ for titles/metadata
        const rfq = await prisma.rFQ.findUnique({
          where: { id: approval.rfqId },
          include: { createdBy: true }
        });
        const vendor = await prisma.vendor.findUnique({
          where: { id: approval.quotation.vendorId },
          include: { user: true }
        });
        const rfqTitle = rfq?.title || 'RFQ';

        if (action === 'REJECT') {
          // Log Activity
          await activityService.logActivity(
            userId,
            'APPROVAL',
            `Approval workflow for Quotation rejected by user ${userId}`,
            { approvalId: id, quotationId: approval.quotationId, rfqId: approval.rfqId }
          );

          // Notify RFQ Creator
          if (rfq?.createdByUserId) {
            await activityService.createNotification(
              rfq.createdByUserId,
              'APPROVAL',
              'Approval Workflow Rejected',
              `The approval workflow for RFQ "${rfqTitle}" has been rejected by the approver.`,
              true
            );
          }

          // Notify Vendor
          if (vendor?.userId) {
            await activityService.createNotification(
              vendor.userId,
              'APPROVAL',
              'Quotation Rejected',
              `Your quotation for RFQ "${rfqTitle}" has been rejected.`,
              true
            );
          }
        } else {
          // APPROVED
          // Check if there was a next step
          const activeStepIndex = approval.chain.findIndex(step => step.status === 'PENDING');
          const nextStep = approval.chain.find(step => step.stepNumber === approval.chain[activeStepIndex].stepNumber + 1);

          if (nextStep) {
            // Log Step approval
            await activityService.logActivity(
              userId,
              'APPROVAL',
              `Approval step ${approval.chain[activeStepIndex].stepNumber} approved by user ${userId}`,
              { approvalId: id, stepNumber: approval.chain[activeStepIndex].stepNumber }
            );

            // Notify next step's user
            await activityService.createNotification(
              nextStep.userId,
              'APPROVAL',
              'Approval Action Required',
              `You have a pending approval step for RFQ "${rfqTitle}". Please review.`,
              true
            );
          } else {
            // Fully approved!
            await activityService.logActivity(
              userId,
              'APPROVAL',
              `Approval workflow fully approved for RFQ "${rfqTitle}". Purchase Order auto-generated.`,
              { approvalId: id, quotationId: approval.quotationId, rfqId: approval.rfqId }
            );

            // Notify RFQ Creator
            if (rfq?.createdByUserId) {
              await activityService.createNotification(
                rfq.createdByUserId,
                'APPROVAL',
                'Approval Workflow Completed',
                `The approval workflow for RFQ "${rfqTitle}" has been fully approved. A draft Purchase Order has been generated.`,
                true
              );
            }

            // Notify Vendor
            if (vendor?.userId) {
              await activityService.createNotification(
                vendor.userId,
                'APPROVAL',
                'Quotation Selected',
                `Congratulations! Your quotation for RFQ "${rfqTitle}" has been selected and approved.`,
                true
              );
            }
          }
        }
      }

      res.json(updatedApproval);
    } catch (err) {
      next(err);
    }
  }
};
