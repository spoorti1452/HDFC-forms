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
/**
 * @param {scope} globals
 * @returns {string}
 */
function calculateEMI(globals = {}) {
  /* =========================
     SAFETY CHECK
  ========================= */
  if (!globals?.form || !globals?.functions) {
    console.log("❌ Globals not available");
    return '';
  }

  /* =========================
     🔍 DEBUG START
  ========================= */
  console.log("===== DEBUG START =====");

  console.log("FORM KEYS:", Object.keys(globals.form));

  console.log("offer_Panel:", globals.form.offer_Panel);
  console.log("loanAmount field:", globals.form.offer_Panel?.loanAmount);
  console.log("loanTenure field:", globals.form.offer_Panel?.loanTenure);

  console.log("loan_offer:", globals.form.loan_offer);
  console.log("summary:", globals.form.loan_offer?.loan_offer_summary);
  console.log(
    "grid:",
    globals.form.loan_offer?.loan_offer_summary?.offer_details_grid
  );
  console.log(
    "emi field:",
    globals.form.loan_offer?.loan_offer_summary?.offer_details_grid?.emi_Amount
  );

  console.log("===== DEBUG END =====");

  /* =========================
     GET FIELD REFERENCES
  ========================= */
  const loanField = globals.form.offer_Panel?.loanAmount;
  const tenureField = globals.form.offer_Panel?.loanTenure;

  const emiField =
    globals.form.loan_offer
      ?.loan_offer_summary
      ?.offer_details_grid
      ?.emi_Amount;

  const roiField =
    globals.form.loan_offer
      ?.loan_offer_summary
      ?.offer_details_grid
      ?.rate_of_Interest;

  const taxField =
    globals.form.loan_offer
      ?.loan_offer_summary
      ?.offer_details_grid
      ?.taxes;

  const loanDisplayField =
    globals.form.loan_offer
      ?.loan_offer_summary
      ?.avail_XPRESS_Personal_Loan_of;

  /* =========================
     VALUE GETTER (IMPORTANT)
  ========================= */
  function getValue(field) {
    if (!field) return 0;

    const input = field.element?.querySelector('input');

    // 🔥 take value from slider dataset
    if (input && input.dataset.actualValue) {
      return Number(input.dataset.actualValue);
    }

    return Number(field.value) || 0;
  }

  const P = getValue(loanField);
  const n = getValue(tenureField);

  console.log("Loan Value:", P);
  console.log("Tenure Value:", n);

  if (!P || !n) {
    console.log("❌ Missing values");
    return '';
  }

  /* =========================
     EMI CALCULATION
  ========================= */
  const annualRate = 10.97;
  const r = annualRate / (12 * 100);

  const emi =
    (P * r * Math.pow(1 + r, n)) /
    (Math.pow(1 + r, n) - 1);

  const emiRounded = Math.round(emi);

  console.log("EMI:", emiRounded);

  /* =========================
     SET VALUES
  ========================= */
  function setValue(field, value) {
    if (!field) return;

    globals.functions.setProperty(field, {
      value: value,
    });
  }

  setValue(emiField, `₹${emiRounded.toLocaleString('en-IN')}`);
  setValue(roiField, `${annualRate}%`);
  setValue(taxField, '₹4,000');
  setValue(loanDisplayField, `₹${P.toLocaleString('en-IN')}`);

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