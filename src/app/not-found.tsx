"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";
import Footer from "@/components/Footer";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl w-full"
        >
          <Card className="bg-white shadow-[0_20px_60px_rgb(0,0,0,0.1)] border-0 overflow-hidden">
            <CardContent className="p-12 text-center">
              <h1 className="text-8xl md:text-9xl font-heading text-[#112248] leading-none mb-8">
                404
              </h1>
              <h2 className="text-3xl md:text-4xl font-heading text-[#112248] mb-4">
                Page Not Found
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed max-w-md mx-auto mb-8">
                The page you&apos;re looking for has wandered off. Let&apos;s get you back to your Brand Roadmap.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-[#112248] text-[#112248] hover:bg-[#112248] hover:text-white transition-all duration-300 font-semibold px-8 py-3"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
                <Button
                  onClick={() => router.push("/start")}
                  className="w-full sm:w-auto bg-[#112248] hover:opacity-90 text-white font-semibold px-8 py-3 transition-all duration-300"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Start Over
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
