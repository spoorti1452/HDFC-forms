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
 * Update timer and attempts display
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
 * Reset OTP flow after attempts finish
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
 * Start OTP timer after successful OTP generation
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

      if ((globals.otpAttemptCount || 0) < 3) {
        globals.functions.setProperty(
          globals.form.otp_verification.resendOTP,
          { value: 'Please click Generate OTP again' }
        );

        globals.functions.setProperty(
          globals.form.view_loan_eligibility,
          { enabled: true }
        );
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
 * Call this from Generate OTP success handler
 * @param {scope} globals
 */
function handleOtpGenerated(globals) {
  console.log('handleOtpGenerated called');

  globals.functions.setProperty(
    globals.form.otp_verification.resendOTP,
    { value: 'Timer function called' }
  );

  globals.functions.setProperty(
    globals.form.otp_verification.attempts,
    { value: 'Debug attempts' }
  );

  if (!globals.otpAttemptCount) {
    globals.otpAttemptCount = 0;
  }

  globals.otpAttemptCount += 1;

  startOtpTimer(globals);
}

/**
 * Call this when OTP validation is successful
 * @param {scope} globals
 */
function handleOtpValidated(globals) {
  clearOtpTimer(globals);

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
  handleOtpGenerated,
  handleOtpValidated,
};