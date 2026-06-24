"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight, CheckCircle } from "lucide-react";
import Footer from "@/components/Footer";

export default function ExpiredReportPage({ params }: { params: Promise<{ shortId: string }> }) {
  const [shortId, setShortId] = useState<string>("");

  useEffect(() => {
    params.then(({ shortId: paramShortId }) => {
      setShortId(paramShortId);
    });
  }, [params]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - matches /start layout */}
      <section className="relative overflow-hidden bg-[#112248] text-white">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="pb-10">
                <motion.h1
                  className="text-4xl md:text-6xl font-heading text-white"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  This Report Has Expired
                </motion.h1>
              </div>
              <motion.div
                className="w-20 h-0.5 bg-[#a7c140] mx-auto mb-6"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
              <motion.p
                className="text-xl text-white/60 mb-10 max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Brand Advantage™ reports are available for 7 days. This report is no longer accessible.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center mb-14"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="h-14 px-12 text-[20px] font-bold text-[#112248] bg-[#a7c140] hover:bg-[#96ad39] uppercase rounded-none shadow-lg transition-all duration-300 tracking-[0.06em]"
                    onClick={() => window.location.href = "/start"}
                  >
                    Get a New Assessment
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="h-14 px-12 text-[20px] font-bold text-white bg-transparent border-2 border-white/30 hover:border-white/60 hover:bg-white/5 uppercase rounded-none shadow-lg transition-all duration-300 tracking-[0.06em]"
                    onClick={() => window.location.href = "https://leftrightlabs.com/start"}
                  >
                    Book a Call
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-wrap justify-center items-center gap-8 text-white/50"
            >
              {[
                { icon: <CheckCircle className="w-5 h-5 text-[#a7c140]" />, text: "No credit card" },
                { icon: <CheckCircle className="w-5 h-5 text-[#a7c140]" />, text: "5 minutes" },
                { icon: <CheckCircle className="w-5 h-5 text-[#a7c140]" />, text: "Personalized brand intelligence" },
                { icon: <CheckCircle className="w-5 h-5 text-[#a7c140]" />, text: "Professional report in your inbox" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                >
                  {item.icon}
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="pt-10 pb-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.h2
              className="text-3xl md:text-4xl font-heading text-[#112248] mb-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Ready for a Fresh Look at Your Brand?
            </motion.h2>
            <div className="w-16 h-0.5 bg-[#a7c140] mx-auto mb-8" />
            <div className="space-y-6 text-left">
              <motion.p
                className="text-xl text-gray-700 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                Your brand evolves. Your strategy should too. Run a new Brand Advantage™ assessment to get an updated analysis of your messaging, visual identity, and positioning.
              </motion.p>
              <motion.p
                className="text-xl text-gray-700 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                Or, if you want to go deeper, book a call with our team. We work with established thought leaders and growth-phase founders to build brands that match who they&apos;ve become.
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
