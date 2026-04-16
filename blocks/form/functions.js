/**
 * Get Full Name
 * @name getFullName Concats first name and last name
 * @param {string} firstname in Stringformat
 * @param {string} lastname in Stringformat
 * @return {string}
 */
function getFullName(firstname, lastname) {
  return `${firstname} ${lastname}`.trim();
}

/**
 * Custom submit function
 * @param {scope} globals
 */
function submitFormArrayToString(globals) {
  const data = globals.functions.exportData();
  Object.keys(data).forEach((key) => {
    if (Array.isArray(data[key])) {
      data[key] = data[key].join(',');
    }
  });
  globals.functions.submitForm(data, true, 'application/json');
}

/**
 * Calculate the number of days between two dates.
 * @param {*} endDate
 * @param {*} startDate
 * @returns {number} returns the number of days between two dates
 */
function days(endDate, startDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  // return zero if dates are valid
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diffInMs = Math.abs(end.getTime() - start.getTime());
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

/**
* Masks the first 5 digits of the mobile number with *
* @param {*} mobileNumber
* @returns {string} returns the mobile number with first 5 digits masked
*/
function maskMobileNumber(mobileNumber) {
  if (!mobileNumber) {
    return '';
  }
  const value = mobileNumber.toString();
  // Mask first 5 digits and keep the rest
  return ` ${'*'.repeat(5)}${value.substring(5)}`;
}

/**
 * Clear OTP timer
 * @param {scope} globals
 */
function clearOtpTimer(globals) {
  if (globals.otpIntervalRef) {
    clearInterval(globals.otpIntervalRef);
    globals.otpIntervalRef = null;
  }
}

/**
 * Update timer text and attempts text
 * @param {number} seconds
 * @param {scope} globals
 */
function updateOtpDisplay(seconds, globals) {
  const attemptsLeft = Math.max(0, 4 - (globals.otpAttemptCount || 0));

  globals.functions.setProperty(
    globals.form.personal_loan_offer.otp_verification.resendOTP,
    { value: `Resend OTP in: ${seconds} secs` }
  );

  globals.functions.setProperty(
    globals.form.personal_loan_offer.otp_verification.attempts,
    { value: `${attemptsLeft}/3 attempts left` }
  );
}

/**
 * Reset OTP flow after 3 attempts
 * @param {scope} globals
 */
function resetOtpFlow(globals) {
  clearOtpTimer(globals);
  globals.otpAttemptCount = 0;

  globals.functions.setProperty(
    globals.form.personal_loan_offer.otp_verification.otp_Value,
    { value: '' }
  );

  globals.functions.setProperty(
    globals.form.personal_loan_offer.otp_verification.resendOTP,
    { value: '' }
  );

  globals.functions.setProperty(
    globals.form.personal_loan_offer.otp_verification.attempts,
    { value: '' }
  );

  globals.functions.setProperty(
    globals.form.personal_loan_offer.generatedOtp,
    { value: '' }
  );

  globals.functions.setProperty(
    globals.form.personal_loan_offer.otp_verification.otpValid,
    { value: '' }
  );

  globals.functions.setProperty(
    globals.form.personal_loan_offer.otp_verification.submit_otp,
    { enabled: false }
  );

  globals.functions.setProperty(
    globals.form.personal_loan_offer.view_loan_eligibility,
    { enabled: true }
  );

  globals.functions.setProperty(
    globals.form.personal_loan_offer.otp_verification,
    { visible: false }
  );
}

/**
 * Start OTP timer
 * @param {scope} globals
 */
function startOtpTimer(globals) {
  clearOtpTimer(globals);

  let seconds = 30;
  updateOtpDisplay(seconds, globals);

  globals.otpIntervalRef = setInterval(async () => {
    seconds -= 1;
    updateOtpDisplay(seconds, globals);

    if (seconds <= 0) {
      clearOtpTimer(globals);

      if (globals.otpAttemptCount < 3) {
        globals.functions.setProperty(
          globals.form.personal_loan_offer.otp_verification.resendOTP,
          { value: 'Generating new OTP...' }
        );

        await generateOtpHandler(globals);
      } else {
        globals.functions.setProperty(
          globals.form.personal_loan_offer.otp_verification.resendOTP,
          { value: 'Maximum OTP attempts reached' }
        );

        globals.functions.setProperty(
          globals.form.personal_loan_offer.otp_verification.attempts,
          { value: '0/3 attempts left' }
        );

        setTimeout(() => {
          resetOtpFlow(globals);
        }, 1500);
      }
    }
  }, 1000);
}

/**
 * Generate OTP and start timer
 * @param {scope} globals
 */
async function generateOtpHandler(globals) {
  try {
    if (!globals.otpAttemptCount) {
      globals.otpAttemptCount = 0;
    }

    const mobileNo = globals.form.personal_loan_offer.aadhaar_linked_mobile_number?.value;
    const dob = globals.form.personal_loan_offer.date_of_birth?.value;

    const response = await fetch('https://ricotta-overcook-abrasive.ngrok-free.dev/api/initiateCustomerIdentification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestString: {
          mobileNo,
          identifierValue: dob,
        },
      }),
    });

    const result = await response.json();

    if (result?.status?.responseCode === '0' && result?.responseString?.otpSent === 'Y') {
      globals.otpAttemptCount += 1;

      globals.functions.setProperty(
        globals.form.personal_loan_offer.generatedOtp,
        { value: result?.responseString?.otpValue || '' }
      );

      globals.functions.setProperty(
        globals.form.personal_loan_offer.otp_verification.attempts,
        { value: `${Math.max(0, 4 - globals.otpAttemptCount)}/3 attempts left` }
      );

      globals.functions.setProperty(
        globals.form.personal_loan_offer.otp_verification,
        { visible: true }
      );

      globals.functions.setProperty(
        globals.form.personal_loan_offer.otp_verification.otp_Value,
        { value: '' }
      );

      globals.functions.setProperty(
        globals.form.personal_loan_offer.otp_verification.otpValid,
        { value: '' }
      );

      globals.functions.setProperty(
        globals.form.personal_loan_offer.otp_verification.submit_otp,
        { enabled: true }
      );

      globals.functions.setProperty(
        globals.form.personal_loan_offer.view_loan_eligibility,
        { enabled: false }
      );

      startOtpTimer(globals);
    } else {
      globals.functions.setProperty(
        globals.form.personal_loan_offer.otp_verification.otpValid,
        { value: 'OTP generation failed' }
      );
    }
  } catch (error) {
    globals.functions.setProperty(
      globals.form.personal_loan_offer.otp_verification.otpValid,
      { value: 'Error while generating OTP' }
    );
  }
}

/**
 * Validate entered OTP
 * @param {scope} globals
 */
async function validateOtpHandler(globals) {
  try {
    const mobileNo = globals.form.personal_loan_offer.aadhaar_linked_mobile_number?.value;
    const dob = globals.form.personal_loan_offer.date_of_birth?.value;
    const otpValue = globals.form.personal_loan_offer.otp_verification.otp_Value?.value;

    const response = await fetch('https://ricotta-overcook-abrasive.ngrok-free.dev/api/validateOtp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestString: {
          mobileNo,
          identifierValue: dob,
          otpValue,
        },
      }),
    });

    const result = await response.json();

    if (result?.status?.responseCode === '0' && result?.responseString?.otpValid === 'Y') {
      clearOtpTimer(globals);

      globals.functions.setProperty(
        globals.form.personal_loan_offer.otp_verification.otpValid,
        { value: 'OTP validated successfully' }
      );

      globals.functions.setProperty(
        globals.form.personal_loan_offer.otp_verification.resendOTP,
        { value: '' }
      );

      globals.functions.setProperty(
        globals.form.personal_loan_offer.otp_verification.attempts,
        { value: '' }
      );

      globals.functions.setProperty(
        globals.form.personal_loan_offer.view_loan_eligibility,
        { enabled: true }
      );
    } else {
      globals.functions.setProperty(
        globals.form.personal_loan_offer.otp_verification.otpValid,
        { value: 'Invalid OTP' }
      );
    }
  } catch (error) {
    globals.functions.setProperty(
      globals.form.personal_loan_offer.otp_verification.otpValid,
      { value: 'Error while validating OTP' }
    );
  }
}

// eslint-disable-next-line import/prefer-default-export
export {
  getFullName,
  days,
  submitFormArrayToString,
  maskMobileNumber,
  clearOtpTimer,
  updateOtpDisplay,
  resetOtpFlow,
  startOtpTimer,
  generateOtpHandler,
  validateOtpHandler,
};