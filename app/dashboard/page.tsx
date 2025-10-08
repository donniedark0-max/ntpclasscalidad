"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CourseCard from "@/components/courses/course-card";
import ActivitySidebar from "@/components/dashboard/activity-sidebar";
import { courses, activities } from "@/lib/data/mock-data";
import Image from "next/image";

const banners = [
  { src: "/images/banner-utp-1.webp", alt: "Anuncio de ahorro en cuotas" },
  { src: "/images/banner-utp-2.webp", alt: "Anuncio de bienvenida" },
  { src: "/images/banner-utp-3.webp", alt: "Anuncio de eventos" },
];

export default function DashboardPage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); 

    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
      {}
      <div className="mb-8 flex justify-center">
        <div className="w-full max-w-5xl">
          <div className="relative overflow-hidden rounded-lg shadow-lg">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {banners.map((banner, index) => (
                <div className="relative h-48 min-w-full" key={index}>
                  <Image
                    src={banner.src}
                    alt={banner.alt}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    sizes="(max-width: 1024px) 100vw, 1024px"
                    quality={90}
                  />
                </div>
              ))}
            </div>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    currentIndex === index ? "bg-white" : "bg-white/50"
                  }`}
                  aria-label={`Ir a la diapositiva ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          {}
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="text-xl font-semibold">Mis cursos</h2>
            <div className="flex items-center gap-3">
              <label htmlFor="period-select" className="text-sm font-medium text-gray-700">
                Filtrar por:
              </label>
              <div className="relative">
                <select
                  id="period-select"
                  className="block w-full appearance-none rounded-lg border-gray-300 bg-white py-2 pl-4 pr-8 text-center shadow-sm transition hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option>Periodo actual</option>
                  <option>2024 - Ciclo 1</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="mb-4 text-sm text-gray-600">
            2025 - Ciclo 2 Agosto PREG (001) (Actual)
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          {}
          <div className="mt-12 w-full overflow-hidden rounded-lg bg-gradient-to-r from-red-600 to-red-700">
            <div className="flex h-full flex-col items-center justify-between p-4 text-center text-white sm:flex-row sm:p-8 sm:text-left">
              <div className="max-w-xl">
                <p className="mb-1 text-xs font-medium uppercase sm:text-sm">
                  Evitar dar click en enlaces sospechosos
                </p>
                <h2 className="text-2xl font-bold sm:text-3xl">PROTEGE TUS DATOS</h2>
                <p className="mt-1 text-lg font-bold sm:text-xl">ALERTA DE PHISHING</p>
              </div>
              
              <div className="mt-4 flex flex-shrink-0 items-center justify-center sm:mt-0">
                <div className="animate-pulse">
                  <svg
                    className="h-20 w-20 text-white sm:h-28 sm:w-28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ActivitySidebar activities={activities} />
      </div>
    </DashboardLayout>
  );
} 