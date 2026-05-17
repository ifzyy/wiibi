import { motion } from "framer-motion";
import { Check } from "lucide-react";

const container = {
  hidden: { opacity: 0, filter: "blur(8px)" },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1], // Apple-like ease
      staggerChildren: 0.12,
    },
  },
};

const card = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 18,
    },
  },
};

const circle = {
  hidden: { scale: 0.8, opacity: 0 },
  show: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 180,
      damping: 12,
      delay: 0.1,
    },
  },
};

const checkmark = {
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeInOut",
      delay: 0.2,
    },
  },
};

const text = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const button = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
      delay: 0.2,
    },
  },
};

export default function SuccessCard({ isSubmitted }) {
  return (
    <div className="bg-white min-h-[500px] flex flex-col justify-center">
      {isSubmitted && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center justify-center text-center p-12 bg-stone-50/50 rounded-[2.5rem] border border-stone-100"
        >
          <motion.div
            variants={card}
            className="bg-[#F9F9F9] w-full max-w-[360px] rounded-[32px] p-12 text-center shadow-2xl"
          >
            <motion.div
              variants={circle}
              className="w-20 h-20 bg-white border border-stone-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm"
            >
              <motion.div
                className="w-10 h-10 rounded-full border-2 border-stone-200 flex items-center justify-center"
                initial="hidden"
                animate="show"
              >
                <motion.svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="#FFAA14"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    d="M20 6L9 17L4 12"
                    variants={checkmark}
                  />
                </motion.svg>
              </motion.div>
            </motion.div>

            <motion.p
              variants={text}
              className="text-[#FFAA14] font-bold text-sm mb-10 px-4 leading-relaxed"
            >
              We have gotten your submission
            </motion.p>

            <motion.button
              variants={button}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[#FFAA14] text-white font-black py-4 rounded-2xl transition-all shadow-lg"
            >
              Continue
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}