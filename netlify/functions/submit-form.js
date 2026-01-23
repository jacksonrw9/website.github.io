export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { recaptchaToken, formData } = JSON.parse(event.body);

    // Verify reCAPTCHA
    const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
    });

    const recaptchaData = await recaptchaResponse.json();

    // Check if reCAPTCHA validation passed
    if (!recaptchaData.success || recaptchaData.score < 0.5) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'reCAPTCHA validation failed' })
      };
    }

    // Submit to HubSpot
    const hubspotResponse = await fetch(
      `https://api.hsforms.com/submissions/v3/integration/submit/${process.env.HUBSPOT_PORTAL_ID}/${process.env.HUBSPOT_FORM_ID}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      }
    );

    const hubspotData = await hubspotResponse.json();

    return {
      statusCode: 200,
      body: JSON.stringify(hubspotData)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}
