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
   EMI + LOAN SUMMARY UPDATE
========================= */
/**
 * @param {scope} globals
 * @returns {string}
 */
function calculateEMI(globals) {

  const loanAmount =
    Number(globals.form.offer_Panel?.loanAmount?.value) || 0;

  const loanTenure =
    Number(globals.form.offer_Panel?.loanTenure?.value) || 0;

  console.log("loanAmount:", loanAmount);
  console.log("loanTenure:", loanTenure);

  /* 🔥 FIX: wait until both values exist */
  if (loanAmount === 0 || loanTenure === 0) {
    return '';
  }

  const annualRate = 10.97;
  const monthlyRate = annualRate / 12 / 100;

  const factor = Math.pow(1 + monthlyRate, loanTenure);

  const emi = Math.round(
    (loanAmount * monthlyRate * factor) / (factor - 1)
  );

  const formattedLoan = "₹" + loanAmount.toLocaleString("en-IN");

  const summary = globals.form.loan_offer?.loan_offer_summary;
  const grid = summary?.offer_details_grid;

  if (grid?.emi_Amount)
    grid.emi_Amount.value = "₹" + emi.toLocaleString("en-IN");

  if (summary?.avail_XPRESS_Personal_Loan_of)
    summary.avail_XPRESS_Personal_Loan_of.value = formattedLoan;

  if (grid?.rate_of_Interest)
    grid.rate_of_Interest.value = annualRate + "%";

  if (grid?.taxes)
    grid.taxes.value = "₹4000";

  return emi;
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