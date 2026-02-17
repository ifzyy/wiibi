import React, { useState, useRef } from "react";
import { X, Check } from "lucide-react";

const AuthModal = ({ isOpen, onClose, view, setView }) => {
  const [step, setStep] = useState("form"); // 'form', 'otp', 'success'
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const otpRefs = useRef([]);

  if (!isOpen) return null;

  // --- LOGIC HANDLERS ---
  const handlePhoneSubmit = () => {
    // Mocking successful API call to send OTP
    setStep("otp");
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.value !== "" && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpVerify = () => {
    // Mocking successful verification
    setStep("success");
  };

  const handleClose = () => {
    setStep("form");
    setOtp(new Array(6).fill(""));
    onClose();
  };

  // --- 1. SUCCESS VIEW ---
  if (step === "success") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-[#F9F9F9] w-full max-w-[360px] rounded-[32px] p-12 text-center shadow-2xl animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-white border  border-stone-50 -100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
            <div className="w-10 h-10 rounded-full border-2  border-stone-50   flex items-center justify-center">
              <Check size={20} strokeWidth={3} className="text-[#FFAA14 ]  " />
            </div>
          </div>
          <p className="text-[#FFAA14 ] -500 font-bold text-sm mb-10 px-4 leading-relaxed">
            We have gotten your submission
          </p>
          <button
            onClick={handleClose}
            className="w-full bg-[#FFAA14] text-white font-black py-4 rounded-2xl hover:bg-amber-500 transition-all shadow-lg"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // --- 2. OTP VIEW ---
  if (step === "otp") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-[440px] rounded-[32px] p-10 shadow-2xl relative animate-in fade-in zoom-in duration-300">
          <button
            onClick={handleClose}
            className="absolute top-8 right-8 text-[#FFAA14 ] -400 hover:text-[#FFAA14 ]  "
          >
            <X size={24} />
          </button>

          <div className="mb-8">
            <h2 className="text-2xl font-black text-[#FFAA14 ]   mb-2">
              Verify your Phone Number
            </h2>
            <p className="text-[#FFAA14 ] -500 font-medium text-sm leading-relaxed">
              Please enter the OTP token sent to your email, <br />
              <span className="text-[#FFAA14 ]   font-bold">
                +234 8123456789
              </span>
            </p>
          </div>

          <div className="flex justify-between gap-2 mb-10">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                ref={(el) => (otpRefs.current[index] = el)}
                value={data}
                onChange={(e) => handleOtpChange(e.target, index)}
                onFocus={(e) => e.target.select()}
                className="w-12 h-14 bg-stone-100 border  border-stone-50 -100 rounded-xl text-center font-black text-xl text-[#FFAA14 ]   focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all"
              />
            ))}
          </div>

          <button
            onClick={handleOtpVerify}
            className="w-full bg-[#FFAA14] hover:bg-amber-500 text-white font-black py-5 rounded-2xl transition-all shadow-lg shadow-amber-100"
          >
            Continue
          </button>

          <div className="text-center mt-8">
            <p className="text-sm font-bold text-[#FFAA14 ] -500">
              I do not have an account{" "}
              <button
                onClick={() => setView("signup")}
                className="text-[#FFAA14]"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- 3. INITIAL PHONE FORM VIEW ---
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-[440px] rounded-[32px] p-10 shadow-2xl relative animate-in fade-in zoom-in duration-300">
        <button
          onClick={handleClose}
          className="absolute top-8 right-8 text-[#FFAA14 ] -400 hover:text-[#FFAA14 ]  "
        >
          <X size={24} />
        </button>

        <div className="mb-8">
          <h2 className="text-3xl font-black text-[#FFAA14 ]   mb-2">
            {view === "login" ? "Log In" : "Sign Up"}
          </h2>
          <p className="text-[#FFAA14 ] -500 font-medium">
            {view === "login"
              ? "Log In to access your account."
              : "Create an account to start your energy journey."}
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-[#FFAA14 ] -400 uppercase tracking-widest mb-3">
              Enter phone number
            </label>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 px-4 py-4 bg-[#FFAA14 ] -50 border  border-stone-50 -100 rounded-2xl">
                <span className="text-xl">🇳🇬</span>
                <span className="font-bold text-[#FFAA14 ]  ">NG</span>
                <span className="text-[#FFAA14 ] -400 text-[10px]">▼</span>
              </div>
              <div className="flex-1 relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-[#FFAA14 ] -400">
                  +234
                </span>
                <input
                  type="tel"
                  className="w-full bg-[#FFAA14 ] -50 border  border-stone-50 -100 rounded-2xl py-4 pl-16 pr-5 font-bold text-[#FFAA14 ]   focus:outline-none"
                  placeholder="800 000 0000"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handlePhoneSubmit}
            className="w-full bg-[#FFAA14] hover:bg-amber-500 text-white font-black py-5 rounded-2xl transition-all shadow-lg"
          >
            Continue
          </button>

          <div className="text-center pt-4">
            <p className="text-sm font-bold text-[#FFAA14 ] -500">
              {view === "login"
                ? "I do not have an account"
                : "Already have an account?"}{" "}
              <button
                onClick={() => setView(view === "login" ? "signup" : "login")}
                className="text-[#FFAA14]"
              >
                {view === "login" ? "Sign Up" : "Log In"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
