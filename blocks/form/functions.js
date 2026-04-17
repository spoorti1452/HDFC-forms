window.otpTimerInterval = window.otpTimerInterval || null;
window.otpResendAttemptsLeft =
  typeof window.otpResendAttemptsLeft === 'number'
    ? window.otpResendAttemptsLeft
    : 3;

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
 * Update attempts display
 * @param {scope} globals
 * @returns {string}
 */
function updateAttemptsInfo(globals) {
  const attemptsField = globals.form.otp_verification.attempts;

  if (!attemptsField) {
    return '';
  }

  const left = window.otpResendAttemptsLeft;

  globals.functions.setProperty(attemptsField, {
    value: left > 0 ? `${left}/3 attempts left` : '0/3 attempts left',
  });

  return '';
}

/**
 * Start 30 sec timer
 * @param {scope} globals
 * @returns {string}
 */
function startOtpTimer(globals) {
  const timerField = globals.form.otp_verification.resendOTP;
  const resendBtn = globals.form.otp_verification.resendOTP_btn;

  let seconds = 30;

  if (!timerField) {
    return '';
  }

  updateAttemptsInfo(globals);

  if (window.otpTimerInterval) {
    clearInterval(window.otpTimerInterval);
    window.otpTimerInterval = null;
  }

  if (resendBtn) {
    globals.functions.setProperty(resendBtn, {
      enabled: false,
    });
  }

  globals.functions.setProperty(timerField, {
    value: `${seconds} secs`,
  });

  window.otpTimerInterval = setInterval(() => {
    seconds -= 1;

    if (seconds >= 0) {
      globals.functions.setProperty(timerField, {
        value: `${seconds} secs`,
      });
    }

    if (seconds <= 0) {
      clearInterval(window.otpTimerInterval);
      window.otpTimerInterval = null;

      globals.functions.setProperty(timerField, {
        value: 'Time expired',
      });

      if (resendBtn && window.otpResendAttemptsLeft > 1) {
        globals.functions.setProperty(resendBtn, {
          enabled: true,
        });
      } else {
        globals.functions.setProperty(resendBtn, {
          enabled: false,
        });

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

  return '';
}

/**
 * Stop timer manually
 * @returns {string}
 */
function stopOtpTimer() {
  if (window.otpTimerInterval) {
    clearInterval(window.otpTimerInterval);
    window.otpTimerInterval = null;
  }

  return '';
}

/**
 * Reset whole OTP flow
 * @param {scope} globals
 * @returns {string}
 */
function resetOtpFlow(globals) {
  stopOtpTimer();

  window.otpResendAttemptsLeft = 3;

  globals.functions.setProperty(
    globals.form.personal_loan_offer.generatedOtp,
    { value: '' }
  );

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
    globals.form.otp_verification.otpValid,
    { value: '' }
  );

  globals.functions.setProperty(
    globals.form.otp_verification.resendOTP_btn,
    { enabled: false }
  );

  globals.functions.setProperty(
    globals.form.personal_loan_offer.view_loan_eligibility,
    { enabled: true }
  );

  globals.functions.setProperty(
    globals.form.otp_verification,
    { visible: false }
  );

  return '';
}

/**
 * Call this from first Generate OTP success handler
 * @param {scope} globals
 * @returns {string}
 */
function handleOtpGenerated(globals) {
  window.otpResendAttemptsLeft = 3;

  setTimeout(() => {
    const data = globals.functions.exportData();

    const otp =
      data.generatedOtp ||
      data.personal_loan_offer?.generatedOtp ||
      '';

    if (otp) {
      alert(String(otp));   // only OTP
    }
  }, 300);

  globals.functions.setProperty(
    globals.form.otp_verification,
    { visible: true }
  );

  globals.functions.setProperty(
    globals.form.otp_verification.resendOTP_btn,
    { enabled: false }
  );

  globals.functions.setProperty(
    globals.form.otp_verification.submit_otp,
    { enabled: true }
  );

  globals.functions.setProperty(
    globals.form.otp_verification.otpValid,
    { value: '' }
  );

  globals.functions.setProperty(
    globals.form.otp_verification.otp_Value,
    { value: '' }
  );

  updateAttemptsInfo(globals);
  startOtpTimer(globals);

  return '';
}
/**
 * Call this from Resend OTP success handler
 * @param {scope} globals
 * @returns {string}
 */
function handleOtpResentAction(globals) {
  if (typeof window.otpResendAttemptsLeft !== 'number') {
    window.otpResendAttemptsLeft = 3;
  }

  if (window.otpResendAttemptsLeft > 1) {
    window.otpResendAttemptsLeft -= 1;
  }

  // 👉 GET OTP AFTER RESEND (same logic as before)
  setTimeout(() => {
    const data = globals.functions.exportData();

    const otp =
      data.generatedOtp ||
      data.personal_loan_offer?.generatedOtp ||
      '';

    if (otp) {
      alert(String(otp));   // only OTP
    }
  }, 300);

  globals.functions.setProperty(
    globals.form.otp_verification.resendOTP_btn,
    { enabled: false }
  );

  globals.functions.setProperty(
    globals.form.otp_verification.submit_otp,
    { enabled: true }
  );

  globals.functions.setProperty(
    globals.form.otp_verification.otp_Value,
    { value: '' }
  );

  globals.functions.setProperty(
    globals.form.otp_verification.otpValid,
    { value: '' }
  );

  updateAttemptsInfo(globals);
  startOtpTimer(globals);

  return '';
}

/**
 * Call this when OTP validation succeeds
 * @param {scope} globals
 * @returns {string}
 */
function handleOtpValidated(globals) {
  const timerField = globals.form.otp_verification.resendOTP;
  const resendBtn = globals.form.otp_verification.resendOTP_btn;

  stopOtpTimer();

  // ✅ Instead of clearing → show stopped state
  if (timerField) {
    globals.functions.setProperty(timerField, {
      value: '00 secs',
    });
  }

  if (resendBtn) {
    globals.functions.setProperty(resendBtn, {
      enabled: false,
    });
  }

  globals.functions.setProperty(
    globals.form.otp_verification.submit_otp,
    { enabled: true }
  );

  return '';
}

/**
 * Call this when OTP validation fails
 * Decrease attempts and keep submit enabled
 * @param {scope} globals
 * @returns {string}
 */
function handleOtpInvalid(globals) {
  if (typeof window.otpResendAttemptsLeft !== 'number') {
    window.otpResendAttemptsLeft = 3;
  }

  if (window.otpResendAttemptsLeft > 0) {
    window.otpResendAttemptsLeft -= 1;
  }

  globals.functions.setProperty(
    globals.form.otp_verification.otp_Value,
    { value: '' }
  );

  globals.functions.setProperty(
    globals.form.otp_verification.submit_otp,
    { enabled: true }
  );

  globals.functions.setProperty(
    globals.form.otp_verification.resendOTP_btn,
    { enabled: false }
  );

  updateAttemptsInfo(globals);

  if (window.otpResendAttemptsLeft <= 0) {
    globals.functions.setProperty(
      globals.form.otp_verification.attempts,
      { value: '0/3 attempts left' }
    );

    setTimeout(() => {
      resetOtpFlow(globals);
    }, 1500);
  }

  return '';
}

export {
  getFullName,
  days,
  submitFormArrayToString,
  maskMobileNumber,
  updateAttemptsInfo,
  startOtpTimer,
  stopOtpTimer,
  resetOtpFlow,
  handleOtpGenerated,
  handleOtpResentAction,
  handleOtpValidated,
  handleOtpInvalid,
};