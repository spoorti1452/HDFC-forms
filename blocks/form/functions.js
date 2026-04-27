/* =========================
   GLOBAL STATE (WORKER SAFE)
========================= */
let otpTimerInterval = null;
let otpResendAttemptsLeft = 3;

/* =========================
   UTILS
========================= */
function getFullName(firstname, lastname) {
  return `${firstname} ${lastname}`.trim();
}

function submitFormArrayToString(globals) {
  const data = globals.functions.exportData();
  Object.keys(data).forEach((key) => {
    if (Array.isArray(data[key])) {
      data[key] = data[key].join(',');
    }
  });
  globals.functions.submitForm(data, true, 'application/json');
}

function days(endDate, startDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start) || isNaN(end)) return 0;

  return Math.floor(Math.abs(end - start) / (1000 * 60 * 60 * 24));
}

function maskMobileNumber(mobileNumber) {
  if (!mobileNumber) return '';
  const value = mobileNumber.toString();
  return `${'*'.repeat(5)}${value.substring(5)}`;
}

/* =========================
   OTP HELPERS
========================= */
function enableSubmitButton(globals) {
  const btn = globals.form?.otp_verification?.submit_otp;
  if (btn) {
    globals.functions.setProperty(btn, { enabled: true });
  }
  return '';
}

function updateAttemptsInfo(globals) {
  const field = globals.form?.otp_verification?.attempts;
  if (!field) return '';

  globals.functions.setProperty(field, {
    value:
      otpResendAttemptsLeft > 0
        ? `${otpResendAttemptsLeft}/3 attempts left`
        : '0/3 attempts left',
  });

  return '';
}

/* =========================
   OTP TIMER
========================= */
function startOtpTimer(globals) {
  const timerField = globals.form?.otp_verification?.resendOTP;
  const resendBtn = globals.form?.otp_verification?.resendOTP_btn;

  if (!timerField) return '';

  let seconds = 5;

  updateAttemptsInfo(globals);

  if (otpTimerInterval) {
    clearInterval(otpTimerInterval);
  }

  if (resendBtn) {
    globals.functions.setProperty(resendBtn, { enabled: false });
  }

  globals.functions.setProperty(timerField, {
    value: `Resend OTP in : ${seconds} secs`,
  });

  otpTimerInterval = setInterval(() => {
    seconds--;

    if (seconds >= 0) {
      globals.functions.setProperty(timerField, {
        value: `Resend OTP in : ${seconds} secs`,
      });
    }

    if (seconds <= 0) {
      clearInterval(otpTimerInterval);
      otpTimerInterval = null;

      globals.functions.setProperty(timerField, {
        value: 'Resend OTP',
      });

      if (resendBtn && otpResendAttemptsLeft > 0) {
        globals.functions.setProperty(resendBtn, { enabled: true });
      }
    }
  }, 1000);

  return '';
}

function stopOtpTimer() {
  if (otpTimerInterval) {
    clearInterval(otpTimerInterval);
    otpTimerInterval = null;
  }
  return '';
}

/* =========================
   OTP FLOW
========================= */
function handleOtpGenerated(globals) {
  otpResendAttemptsLeft = 3;

  setTimeout(() => {
    const data = globals.functions.exportData();

    const otp =
      data.generatedOtp ||
      data.personal_loan_offer?.generatedOtp ||
      '';

    globals.functions.setProperty(globals.form.otp_verification, {
      visible: true,
    });

    globals.functions.setProperty(
      globals.form.otp_verification.resendOTP_btn,
      { enabled: false }
    );

    globals.functions.setProperty(
      globals.form.otp_verification.otp_Value,
      { value: otp ? String(otp) : '' }
    );

    globals.functions.setProperty(
      globals.form.otp_verification.otpValid,
      { value: '' }
    );

    updateAttemptsInfo(globals);
    startOtpTimer(globals);
  }, 300);

  return '';
}

function handleOtpResentAction(globals) {
  if (otpResendAttemptsLeft > 0) {
    otpResendAttemptsLeft--;
  }

  setTimeout(() => {
    const data = globals.functions.exportData();

    const otp =
      data.generatedOtp ||
      data.personal_loan_offer?.generatedOtp ||
      '';

    globals.functions.setProperty(
      globals.form.otp_verification.otp_Value,
      { value: otp ? String(otp) : '' }
    );

    globals.functions.setProperty(
      globals.form.otp_verification.otpValid,
      { value: '' }
    );

    globals.functions.setProperty(
      globals.form.otp_verification.resendOTP_btn,
      { enabled: false }
    );

    updateAttemptsInfo(globals);
    startOtpTimer(globals);
  }, 300);

  return '';
}

function handleOtpValidated(globals) {
  stopOtpTimer();

  globals.functions.setProperty(
    globals.form.otp_verification.otpValid,
    { value: 'OTP validated successfully' }
  );

  return '';
}

function handleOtpInvalid(globals) {
  if (otpResendAttemptsLeft > 0) {
    otpResendAttemptsLeft--;
  }

  stopOtpTimer();

  globals.functions.setProperty(
    globals.form.otp_verification.otpValid,
    { value: 'Invalid OTP' }
  );

  updateAttemptsInfo(globals);

  return '';
}

/* =========================
   EMI CALCULATION (EDS FIXED)
========================= */

/* helper to safely set field value */
function setFieldValue(field, value, globals) {
  if (!field) return;

  globals.functions.setProperty(field, {
    value: value,
  });
}

/* get actual slider value (important for range slider) */
function getActualValue(field) {
  if (!field) return 0;

  const input = field.element?.querySelector('input');

  if (input && input.dataset.actualValue) {
    return Number(input.dataset.actualValue);
  }

  return Number(field.value) || 0;
}
/**
 * Clean EMI function for your form
 */
function calculateEMI(globals) {
  const loanField = globals.form?.offer_panel?.loanAmount;
  const tenureField = globals.form?.offer_panel?.loanTenure;

  const emiField =
    globals.form?.loan_offer?.loan_offer_summary?.offer_details_grid?.emi_Amount;

  const loanDisplayField =
    globals.form?.loan_offer?.loan_offer_summary?.avail_XPRESS_Personal_Loan_of;

  const roiField =
    globals.form?.loan_offer?.loan_offer_summary?.offer_details_grid?.rate_of_Interest;

  const taxField =
    globals.form?.loan_offer?.loan_offer_summary?.offer_details_grid?.taxes;

  function getValue(field) {
    if (!field) return 0;

    const input = field.element?.querySelector('input');

    if (input && input.dataset.actualValue) {
      return Number(input.dataset.actualValue);
    }

    return Number(field.value) || 0;
  }

  function setValue(field, value) {
    if (!field) return;

    globals.functions.setProperty(field, {
      value: value,
    });
  }

  const P = getValue(loanField);
  const n = getValue(tenureField);

  if (!P || !n) return '';

  const r = 10.97 / (12 * 100);

  const emi =
    (P * r * Math.pow(1 + r, n)) /
    (Math.pow(1 + r, n) - 1);

  const emiRounded = Math.round(emi);

  setValue(emiField, `₹${emiRounded.toLocaleString('en-IN')}`);
  setValue(loanDisplayField, `₹${P.toLocaleString('en-IN')}`);
  setValue(roiField, '10.97%');
  setValue(taxField, '₹4,000');

  return '';
}
/* =========================
   EXPORTS
========================= */
export {
  getFullName,
  days,
  submitFormArrayToString,
  maskMobileNumber,
  enableSubmitButton,
  updateAttemptsInfo,
  startOtpTimer,
  stopOtpTimer,
  handleOtpGenerated,
  handleOtpResentAction,
  handleOtpValidated,
  handleOtpInvalid,
  calculateEMI,
};