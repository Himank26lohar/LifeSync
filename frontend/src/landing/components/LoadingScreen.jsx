import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <motion.div
      className="loading-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45 } }}
    >
      <motion.div
        className="loading-screen__orb"
        animate={{ rotate: 360, scale: [1, 1.08, 1] }}
        transition={{ rotate: { duration: 5.5, repeat: Infinity, ease: "linear" }, scale: { duration: 2.4, repeat: Infinity } }}
      />
      <motion.div
        className="loading-screen__ring"
        animate={{ rotate: -360 }}
        transition={{ duration: 7.5, repeat: Infinity, ease: "linear" }}
      />
      <p>Initializing LifeSync AI experience</p>
    </motion.div>
  );
}
