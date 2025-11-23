"use client";
import { useEffect, useState, useRef } from "react";

interface TypingAnimationProps {
  category: string;
}

export default function TypingAnimation({ category }: TypingAnimationProps) {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting' | 'done'>('typing');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    audioRef.current = new Audio('/typing.mp3');
  }, []);

  useEffect(() => {
    const categoryUpper = category.toUpperCase();
    let currentIndex = 0;
    
    if (phase === 'typing') {
      const typingInterval = setInterval(() => {
        if (currentIndex <= categoryUpper.length) {
          setDisplayText(categoryUpper.slice(0, currentIndex));
          
          if (currentIndex < categoryUpper.length && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(err => console.log('Audio play failed:', err));
          }
          
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          setPhase('pausing');
        }
      }, 150);
      return () => clearInterval(typingInterval);
    }
    
    if (phase === 'pausing') {
      const pauseTimer = setTimeout(() => {
        setPhase('deleting');
      }, 1000);
      
      return () => clearTimeout(pauseTimer);
    }
    
    if (phase === 'deleting') {
      currentIndex = categoryUpper.length;
      
      const deleteInterval = setInterval(() => {
        if (currentIndex >= 0) {
          setDisplayText(categoryUpper.slice(0, currentIndex));
          currentIndex--;
        } else {
          clearInterval(deleteInterval);
          setPhase('done');
        }
      }, 100);
      return () => clearInterval(deleteInterval);
    }
  }, [category, phase]);

  useEffect(() => {
    if (phase !== 'done') {
      const cursorInterval = setInterval(() => {
        setShowCursor(prev => !prev);
      }, 500);
      return () => clearInterval(cursorInterval);
    } else {
      setShowCursor(false);
    }
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 50,
      fontSize: '72px',
      fontWeight: '900',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      letterSpacing: '8px',
      textShadow: '4px 4px 8px rgba(0,0,0,0.9), 0 0 20px rgba(255,255,255,0.3)'
    }}>
      {displayText}
      <span style={{ opacity: showCursor ? 1 : 0 }}>|</span>
    </div>
  );
}