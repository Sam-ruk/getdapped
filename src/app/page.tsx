"use client";
import { useState, useRef, useEffect } from "react";
import MainScene from "@/components/MainScene";
import CategoryScene from "@/components/CategoryScene";
import { CATEGORIES, DappsCollection } from "@/types";
import * as THREE from "three";

export default function Page() {
  const scrollRef = useRef(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sphereColor, setSphereColor] = useState<THREE.Color | null>(null);
  const [pausedScrollTime, setPausedScrollTime] = useState(11);
  const [dappsData, setDappsData] = useState<DappsCollection>({});

  useEffect(() => {
    fetch('/dapps.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load dapps.json');
        return res.json();
      })
      .then(data => setDappsData(data))
      .catch(err => {
        console.error('Error loading dapps:', err);
        setDappsData({});
      });
  }, []);

  useEffect(() => {
    if (selectedCategory === null) {
      function updateScroll() {
        const h = document.body.scrollHeight - window.innerHeight;
        const pct = h > 0 ? window.scrollY / h : 0;
        scrollRef.current = pct * 22;
      }
      updateScroll();
      window.addEventListener("scroll", updateScroll);
      return () => window.removeEventListener("scroll", updateScroll);
    }
  }, [selectedCategory]);

  const handleSphereClick = (categoryIndex: number, color: THREE.Color) => {
    setPausedScrollTime(scrollRef.current);
    const category = CATEGORIES[categoryIndex];
    
    if (!category) {
      console.error('Invalid category index:', categoryIndex);
      return;
    }
    
    console.log('Clicked sphere:', categoryIndex, 'Category:', category);
    setSelectedCategory(category);
    setSphereColor(color);
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setSphereColor(null);
    setTimeout(() => {
      const h = document.body.scrollHeight - window.innerHeight;
      if (h > 0) {
        const targetScroll = (pausedScrollTime / 22) * h;
        window.scrollTo(0, targetScroll);
      }
      scrollRef.current = pausedScrollTime;
    }, 100);
  };

  return (
    <div style={{ 
      height: selectedCategory ? "100vh" : "800vh", 
      background: "#000", 
      position: 'relative' 
    }}>
      {selectedCategory ? (
        <CategoryScene 
          category={selectedCategory}
          sphereColor={sphereColor}
          dappsData={dappsData[selectedCategory] || []}
          onBack={handleBack}
        />
      ) : (
        <MainScene 
          scrollRef={scrollRef} 
          onSphereClick={handleSphereClick}
        />
      )}
    </div>
  );
}