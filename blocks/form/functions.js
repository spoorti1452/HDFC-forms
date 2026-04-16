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
 * @returns {number}
 */
function days(endDate, startDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diffInMs = Math.abs(end.getTime() - start.getTime());
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

/**
 * Masks the first 5 digits of the mobile number with *
 * @param {*} mobileNumber
 * @returns {string}
 */
function maskMobileNumber(mobileNumber) {
  if (!mobileNumber) {
    return '';
  }
  const value = mobileNumber.toString();
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
    globals.form.otp_verification.resendOTP,
    { value: `Resend OTP in: ${seconds} secs` }
  );

  globals.functions.setProperty(
    globals.form.otp_verification.attempts,
    { value: `${attemptsLeft}/3 attempts left` }
  );
}

/**
 * Reset OTP flow
 * @param {scope} globals
 */
function resetOtpFlow(globals) {
  clearOtpTimer(globals);
  globals.otpAttemptCount = 0;

  globals.functions.setProperty(
    globals.form.otp_verification.otp_Value,
    { value: '' }
  );

  globals.functions.setProperty(
    globals.form.otp_verification.resendOTP,
    { value: '' }
  );

  globals.functions.setProperty(
    globals.form.otp_verification.attempts,
    { value: '' }
  );

  globals.functions.setProperty(
    globals.form.generatedOtp,
    { value: '' }
  );

  globals.functions.setProperty(
    globals.form.otp_verification.otpValid,
    { value: '' }
  );

  globals.functions.setProperty(
    globals.form.otp_verification.submit_otp,
    { enabled: false }
  );

  globals.functions.setProperty(
    globals.form.view_loan_eligibility,
    { enabled: true }
  );

  globals.functions.setProperty(
    globals.form.otp_verification,
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

  globals.otpIntervalRef = setInterval(() => {
    seconds -= 1;
    updateOtpDisplay(seconds, globals);

    if (seconds <= 0) {
      clearOtpTimer(globals);

      if (globals.otpAttemptCount < 3) {
        globals.functions.setProperty(
          globals.form.otp_verification.resendOTP,
          { value: 'Generating new OTP...' }
        );

        generateOtpHandler(globals);
      } else {
        globals.functions.setProperty(
          globals.form.otp_verification.resendOTP,
          { value: 'Maximum OTP attempts reached' }
        );

        globals.functions.setProperty(
          globals.form.otp_verification.attempts,
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
 * Generate OTP
 * @param {scope} globals
 */
function generateOtpHandler(globals) {
  globals.functions.setProperty(
    globals.form.otp_verification.otpValid,
    { value: 'Generate OTP clicked' }
  );

  if (!globals.otpAttemptCount) {
    globals.otpAttemptCount = 0;
  }

  const formData = globals.functions.exportData();

  const mobileNo = formData.aadhaar_linked_mobile_number || '';
  const dob = formData.date_of_birth || '';

  console.log('Generate OTP payload values:', { mobileNo, dob, formData });

  fetch('https://ricotta-overcook-abrasive.ngrok-free.dev/api/initiateCustomerIdentification', {
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
  })
    .then(async (response) => {
      const result = await response.json();
      console.log('Generate OTP response:', result);

      if (!response.ok) {
        throw new Error(result?.message || 'Generate OTP API failed');
      }

      return result;
    })
    .then((result) => {
      if (result?.status?.responseCode === '0' && result?.responseString?.otpSent === 'Y') {
        globals.otpAttemptCount += 1;

        globals.functions.setProperty(
          globals.form.generatedOtp,
          { value: result?.responseString?.otpValue || '' }
        );

        globals.functions.setProperty(
          globals.form.otp_verification.attempts,
          { value: `${Math.max(0, 4 - globals.otpAttemptCount)}/3 attempts left` }
        );

        globals.functions.setProperty(
          globals.form.otp_verification,
          { visible: true }
        );

        globals.functions.setProperty(
          globals.form.otp_verification.otp_Value,
          { value: '' }
        );

        globals.functions.setProperty(
          globals.form.otp_verification.otpValid,
          { value: '' }
        );

        globals.functions.setProperty(
          globals.form.otp_verification.submit_otp,
          { enabled: true }
        );

        globals.functions.setProperty(
          globals.form.view_loan_eligibility,
          { enabled: false }
        );

        startOtpTimer(globals);
      } else {
        globals.functions.setProperty(
          globals.form.otp_verification.otpValid,
          { value: 'OTP generation failed' }
        );
      }
    })
    .catch((error) => {
      console.error('Generate OTP error:', error);
      globals.functions.setProperty(
        globals.form.otp_verification.otpValid,
        { value: `Error while generating OTP: ${error.message}` }
      );
    });
}

function validateOtpHandler(globals) {
  const formData = globals.functions.exportData();

  const mobileNo = formData.aadhaar_linked_mobile_number || '';
  const dob = formData.date_of_birth || '';
  const otpValue = formData.otp_Value || '';

  console.log('Validate OTP payload values:', { mobileNo, dob, otpValue, formData });

  fetch('https://ricotta-overcook-abrasive.ngrok-free.dev/api/validateOtp', {
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
  })
    .then(async (response) => {
      const result = await response.json();
      console.log('Validate OTP response:', result);

      if (!response.ok) {
        throw new Error(result?.message || 'Validate OTP API failed');
      }

      return result;
    })
    .then((result) => {
      if (result?.status?.responseCode === '0' && result?.responseString?.otpValid === 'Y') {
        clearOtpTimer(globals);

        globals.functions.setProperty(
          globals.form.otp_verification.otpValid,
          { value: 'OTP validated successfully' }
        );

        globals.functions.setProperty(
          globals.form.otp_verification.resendOTP,
          { value: '' }
        );

        globals.functions.setProperty(
          globals.form.otp_verification.attempts,
          { value: '' }
        );

        globals.functions.setProperty(
          globals.form.view_loan_eligibility,
          { enabled: true }
        );
      } else {
        globals.functions.setProperty(
          globals.form.otp_verification.otpValid,
          { value: 'Invalid OTP' }
        );
      }
    })
    .catch((error) => {
      console.error('Validate OTP error:', error);
      globals.functions.setProperty(
        globals.form.otp_verification.otpValid,
        { value: `Error while validating OTP: ${error.message}` }
      );
    });
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