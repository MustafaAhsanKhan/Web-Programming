export async function sendLeadAssignmentEmail(agentEmail: string, leadName: string, leadId: string) {
  // TODO: Integrate SendGrid, Resend, or Nodemailer here
  console.log(`[EMAIL MOCK] Sending assignment email to ${agentEmail} for lead ${leadName} (ID: ${leadId})`);
  return Promise.resolve({ success: true });
}
