import StaticPage from './StaticPage';

export function PrivacyPolicy() {
  return (
    <StaticPage title="Privacy Policy">
      <p>We respect your privacy. Registration data is used solely for festival administration, verification, and communication related to IMA Navli Navratri.</p>
    </StaticPage>
  );
}

export function RefundPolicy() {
  return (
    <StaticPage title="Refund Policy">
      <p>Refund requests are handled as per festival policy. Contact imanavlinavratri@gmail.com for assistance.</p>
    </StaticPage>
  );
}

export function FAQ() {
  return (
    <StaticPage title="FAQ">
      <p><strong>Q: What ID is required?</strong><br />A: Valid government photo ID (Aadhar with address) is mandatory.</p>
      <p><strong>Q: Can I register multiple players?</strong><br />A: Limits apply per mobile number based on player category.</p>
    </StaticPage>
  );
}

export function TermsCondition() {
  return (
    <StaticPage title="Terms and Conditions">
      <p>By registering, you agree to festival rules, verification requirements, and venue guidelines.</p>
    </StaticPage>
  );
}

export function CancellationPolicy() {
  return (
    <StaticPage title="Cancellation Policy">
      <p>Cancellation and payment status updates are recorded in the registration system. Contact support for queries.</p>
    </StaticPage>
  );
}
