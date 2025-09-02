// import { useEffect, useRef, useState } from "react";

// const FRAME_PATH = "/frames/frame_";
// const FRAME_EXT = ".jpg";
// const PADDING = 4;
// const TOTAL_FRAMES = 2187;
// const BATCH_SIZE = 10;
// const PRELOAD_AHEAD = 2; // how many batches ahead/behind to preload

// export default function App() {
//   const canvasRef = useRef(null);
//   const ctxRef = useRef(null);

//   const [loadedBatches, setLoadedBatches] = useState({});
//   const [loadedFrames, setLoadedFrames] = useState(0);
//   const [isLoaded, setIsLoaded] = useState(false);

//   const zoomRef = useRef(0);
//   const targetZoomRef = useRef(0);

//   const widthRef = useRef(window.innerWidth);
//   const heightRef = useRef(window.innerHeight);

//   const lastDrawnFrame = useRef(null); // keep last frame to avoid flicker

//   // --- Resize canvas ---
//   useEffect(() => {
//     const handleResize = () => {
//       widthRef.current = window.innerWidth;
//       heightRef.current = window.innerHeight;

//       const canvas = canvasRef.current;
//       if (canvas) {
//         const dpr = window.devicePixelRatio || 1;
//         canvas.width = window.innerWidth * dpr;
//         canvas.height = window.innerHeight * dpr;
//         canvas.style.width = window.innerWidth + "px";
//         canvas.style.height = window.innerHeight + "px";

//         const ctx = canvas.getContext("2d", { alpha: false });
//         ctx.setTransform(1, 0, 0, 1, 0, 0);
//         ctx.scale(dpr, dpr);
//         ctx.imageSmoothingEnabled = false;
//         ctxRef.current = ctx;
//       }
//     };

//     handleResize();
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   // --- Frame Path ---
//   function framePath(i) {
//     return `${FRAME_PATH}${String(i).padStart(PADDING, "0")}${FRAME_EXT}`;
//   }

//   // --- Load batch ---
//   function loadBatch(batchNum) {
//     return new Promise((resolve) => {
//       if (loadedBatches[batchNum]) return resolve();
//       if (batchNum < 0 || batchNum * BATCH_SIZE >= TOTAL_FRAMES) return resolve();

//       const start = batchNum * BATCH_SIZE + 1;
//       const end = Math.min(start + BATCH_SIZE - 1, TOTAL_FRAMES);
//       let batch = [];
//       let count = 0;

//       for (let i = start; i <= end; i++) {
//         const img = new Image();
//         img.onload = () => {
//           count++;
//           setLoadedFrames((prev) => prev + 1);
//           if (count === end - start + 1) {
//             setLoadedBatches((prev) => ({ ...prev, [batchNum]: batch }));
//             resolve();
//           }
//         };
//         img.onerror = () => {
//           console.warn(`❌ Missing frame: ${i}`);
//           count++;
//           if (count === end - start + 1) {
//             setLoadedBatches((prev) => ({ ...prev, [batchNum]: batch }));
//             resolve();
//           }
//         };
//         img.src = framePath(i);
//         batch.push(img);
//       }
//     });
//   }

//   function ensureBatchLoaded(batchNum) {
//     if (!loadedBatches[batchNum]) {
//       loadBatch(batchNum); // fire & forget (don’t await)
//     }
//   }

//   // --- Draw frame ---
//   function drawFrame(frameIndex) {
//     const ctx = ctxRef.current;
//     if (!ctx) return;
//     const width = widthRef.current;
//     const height = heightRef.current;

//     const batchNum = Math.floor(frameIndex / BATCH_SIZE);
//     const offset = frameIndex % BATCH_SIZE;
//     const batch = loadedBatches[batchNum];
//     if (!batch) {
//       if (lastDrawnFrame.current) {
//         ctx.drawImage(...lastDrawnFrame.current);
//       }
//       return;
//     }

//     const img = batch[offset];
//     if (img && img.complete) {
//       const imgAspect = img.width / img.height;
//       const canvasAspect = width / height;
//       let drawWidth, drawHeight;

//       if (imgAspect > canvasAspect) {
//         drawHeight = height;
//         drawWidth = drawHeight * imgAspect;
//       } else {
//         drawWidth = width;
//         drawHeight = drawWidth / imgAspect;
//       }

//       const x = (width - drawWidth) / 2;
//       const y = (height - drawHeight) / 2;

//       ctx.clearRect(0, 0, width, height);
//       ctx.drawImage(img, x, y, drawWidth, drawHeight);

//       lastDrawnFrame.current = [img, x, y, drawWidth, drawHeight];
//     } else if (lastDrawnFrame.current) {
//       ctx.drawImage(...lastDrawnFrame.current);
//     }
//   }

//   // --- Animation ---
//   useEffect(() => {
//     let animationFrame;
//     function animate() {
//       if (!isLoaded) {
//         animationFrame = requestAnimationFrame(animate);
//         return;
//       }

//       // smooth zoom easing
//       zoomRef.current += (targetZoomRef.current - zoomRef.current) * 0.15;
//       if (Math.abs(targetZoomRef.current - zoomRef.current) < 0.001) {
//         zoomRef.current = targetZoomRef.current;
//       }

//       const frameIndex = Math.floor(zoomRef.current);
//       const batchNum = Math.floor(frameIndex / BATCH_SIZE);

//       // preload nearby batches (non-blocking)
//       for (let i = -PRELOAD_AHEAD; i <= PRELOAD_AHEAD; i++) {
//         ensureBatchLoaded(batchNum + i);
//       }

//       drawFrame(frameIndex);
//       animationFrame = requestAnimationFrame(animate);
//     }
//     animate();

//     return () => cancelAnimationFrame(animationFrame);
//   }, [isLoaded, loadedBatches]);

//   // --- Controls ---
//   useEffect(() => {
//     function handleWheel(e) {
//       if (!isLoaded) return;
//       e.preventDefault();
//       const sensitivity = 0.002;
//       targetZoomRef.current = Math.max(
//         0,
//         Math.min(TOTAL_FRAMES - 1, targetZoomRef.current + e.deltaY * sensitivity * 30)
//       );
//     }
//     window.addEventListener("wheel", handleWheel, { passive: false });

//     function handleKey(e) {
//       if (!isLoaded) return;
//       switch (e.key) {
//         case "ArrowUp":
//         case "ArrowRight":
//           targetZoomRef.current = Math.min(TOTAL_FRAMES - 1, targetZoomRef.current + 5);
//           break;
//         case "ArrowDown":
//         case "ArrowLeft":
//           targetZoomRef.current = Math.max(0, targetZoomRef.current - 5);
//           break;
//         case "Home":
//           targetZoomRef.current = 0;
//           break;
//         case "End":
//           targetZoomRef.current = TOTAL_FRAMES - 1;
//           break;
//         default:
//           break;
//       }
//     }
//     window.addEventListener("keydown", handleKey);

//     return () => {
//       window.removeEventListener("wheel", handleWheel);
//       window.removeEventListener("keydown", handleKey);
//     };
//   }, [isLoaded]);

//   // --- Initial load ---
//   useEffect(() => {
//     (async () => {
//       await loadBatch(0);
//       setIsLoaded(true);
//     })();

//     // 🚫 Disable page scroll
//     document.body.style.overflow = "hidden";
//     return () => {
//       document.body.style.overflow = "auto";
//     };
//   }, []);

//   return (
//     <div
//       style={{
//         height: "100vh",
//         width: "100vw",
//         margin: 0,
//         padding: 0,
//         background: "#000",
//         overflow: "hidden",
//       }}
//     >
//       <canvas ref={canvasRef} style={{ display: "block" }} />
//       {!isLoaded && (
//         <div
//           style={{
//             color: "white",
//             position: "fixed",
//             top: "50%",
//             left: "50%",
//             transform: "translate(-50%,-50%)",
//           }}
//         >
//           Loading frames... {Math.round((loadedFrames / TOTAL_FRAMES) * 100)}%
//         </div>
//       )}
//       {isLoaded && (
//         <div
//           style={{
//             position: "fixed",
//             top: 20,
//             left: 20,
//             background: "rgba(0,0,0,0.6)",
//             padding: 10,
//             borderRadius: 8,
//             color: "#fff",
//             fontFamily: "sans-serif",
//           }}
//         >
//           <div>📱 Pinch to zoom on mobile</div>
//           <div>🖱️ Scroll or arrow keys on desktop</div>
//           <div>
//             Frame: {Math.floor(zoomRef.current) + 1} / {TOTAL_FRAMES}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }






import { useEffect, useRef, useState } from "react";

const FRAME_PATH = "/frames/frame_";
const FRAME_EXT = ".jpg";
const PADDING = 4;
const TOTAL_FRAMES = 2187;
const BATCH_SIZE = 10;
const PRELOAD_AHEAD = 2;

export default function App() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [loadedBatches, setLoadedBatches] = useState({});
  const [loadedFrames, setLoadedFrames] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const zoomRef = useRef(0);
  const targetZoomRef = useRef(0);

  const widthRef = useRef(window.innerWidth);
  const heightRef = useRef(window.innerHeight);

  const lastDrawnFrame = useRef(null);

  // --- Resize canvas ---
  useEffect(() => {
    const handleResize = () => {
      widthRef.current = window.innerWidth;
      heightRef.current = window.innerHeight;

      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = "100%";
        canvas.style.height = "100%";

        const ctx = canvas.getContext("2d", { alpha: false });
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = false;
        ctxRef.current = ctx;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Frame Path ---
  function framePath(i) {
    return `${FRAME_PATH}${String(i).padStart(PADDING, "0")}${FRAME_EXT}`;
  }

  // --- Load batch ---
  function loadBatch(batchNum) {
    return new Promise((resolve) => {
      if (loadedBatches[batchNum]) return resolve();
      if (batchNum < 0 || batchNum * BATCH_SIZE >= TOTAL_FRAMES) return resolve();

      const start = batchNum * BATCH_SIZE + 1;
      const end = Math.min(start + BATCH_SIZE - 1, TOTAL_FRAMES);
      let batch = [];
      let count = 0;

      for (let i = start; i <= end; i++) {
        const img = new Image();
        img.onload = () => {
          count++;
          setLoadedFrames((prev) => prev + 1);
          if (count === end - start + 1) {
            setLoadedBatches((prev) => ({ ...prev, [batchNum]: batch }));
            resolve();
          }
        };
        img.onerror = () => {
          console.warn(`❌ Missing frame: ${i}`);
          count++;
          if (count === end - start + 1) {
            setLoadedBatches((prev) => ({ ...prev, [batchNum]: batch }));
            resolve();
          }
        };
        img.src = framePath(i);
        batch.push(img);
      }
    });
  }

  function ensureBatchLoaded(batchNum) {
    if (!loadedBatches[batchNum]) {
      loadBatch(batchNum);
    }
  }

  // --- Draw frame (COVER MODE) ---
  function drawFrame(frameIndex) {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const width = widthRef.current;
    const height = heightRef.current;

    const batchNum = Math.floor(frameIndex / BATCH_SIZE);
    const offset = frameIndex % BATCH_SIZE;
    const batch = loadedBatches[batchNum];
    if (!batch) {
      if (lastDrawnFrame.current) {
        ctx.drawImage(...lastDrawnFrame.current);
      }
      return;
    }

    const img = batch[offset];
    if (img && img.complete) {
      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;

      let sx, sy, sWidth, sHeight;

      if (imgAspect > canvasAspect) {
        sHeight = img.height;
        sWidth = img.height * canvasAspect;
        sx = (img.width - sWidth) / 2;
        sy = 0;
      } else {
        sWidth = img.width;
        sHeight = img.width / canvasAspect;
        sx = 0;
        sy = (img.height - sHeight) / 2;
      }

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height);

      lastDrawnFrame.current = [img, sx, sy, sWidth, sHeight, 0, 0, width, height];
    } else if (lastDrawnFrame.current) {
      ctx.drawImage(...lastDrawnFrame.current);
    }
  }

  // --- Animation ---
  useEffect(() => {
    let animationFrame;
    function animate() {
      if (!isLoaded) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      zoomRef.current += (targetZoomRef.current - zoomRef.current) * 0.15;
      if (Math.abs(targetZoomRef.current - zoomRef.current) < 0.001) {
        zoomRef.current = targetZoomRef.current;
      }

      const frameIndex = Math.floor(zoomRef.current);
      const batchNum = Math.floor(frameIndex / BATCH_SIZE);

      for (let i = -PRELOAD_AHEAD; i <= PRELOAD_AHEAD; i++) {
        ensureBatchLoaded(batchNum + i);
      }

      drawFrame(frameIndex);
      animationFrame = requestAnimationFrame(animate);
    }
    animate();

    return () => cancelAnimationFrame(animationFrame);
  }, [isLoaded, loadedBatches]);

  // --- Controls (Wheel + Keys + Pinch + iOS Gesture) ---
  useEffect(() => {
    function handleWheel(e) {
      if (!isLoaded) return;
      e.preventDefault();
      const sensitivity = 0.002;
      targetZoomRef.current = Math.max(
        0,
        Math.min(TOTAL_FRAMES - 1, targetZoomRef.current + e.deltaY * sensitivity * 30)
      );
    }
    window.addEventListener("wheel", handleWheel, { passive: false });

    function handleKey(e) {
      if (!isLoaded) return;
      switch (e.key) {
        case "ArrowUp":
        case "ArrowRight":
          targetZoomRef.current = Math.min(TOTAL_FRAMES - 1, targetZoomRef.current + 5);
          break;
        case "ArrowDown":
        case "ArrowLeft":
          targetZoomRef.current = Math.max(0, targetZoomRef.current - 5);
          break;
        case "Home":
          targetZoomRef.current = 0;
          break;
        case "End":
          targetZoomRef.current = TOTAL_FRAMES - 1;
          break;
        default:
          break;
      }
    }
    window.addEventListener("keydown", handleKey);

    // --- Pinch-to-zoom (Android/Chrome) ---
    let lastDistance = null;
    function handleTouchStart(e) {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastDistance = Math.sqrt(dx * dx + dy * dy);
      }
    }
    function handleTouchMove(e) {
      if (e.touches.length === 2 && lastDistance) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDistance = Math.sqrt(dx * dx + dy * dy);
        const delta = newDistance - lastDistance;
        const sensitivity = 0.05; // pinch sensitivity

        // ✅ FIX: invert logic (spread fingers -> zoom in / pinch -> zoom out)
        targetZoomRef.current = Math.max(
          0,
          Math.min(TOTAL_FRAMES - 1, targetZoomRef.current + delta * sensitivity)
        );

        lastDistance = newDistance;
      }
    }
    function handleTouchEnd() {
      lastDistance = null;
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    // --- Native iOS Safari pinch ---
    function handleGestureStart(e) {
      e.preventDefault();
    }
    function handleGestureChange(e) {
      e.preventDefault();
      const scale = e.scale;
      const sensitivity = 50; // adjust for smoothness

      // ✅ FIX: invert logic here too
      if (scale > 1) {
        targetZoomRef.current = Math.min(
          TOTAL_FRAMES - 1,
          targetZoomRef.current + (scale - 1) * sensitivity
        );
      } else {
        targetZoomRef.current = Math.max(
          0,
          targetZoomRef.current - (1 - scale) * sensitivity
        );
      }
    }
    function handleGestureEnd(e) {
      e.preventDefault();
    }

    window.addEventListener("gesturestart", handleGestureStart);
    window.addEventListener("gesturechange", handleGestureChange);
    window.addEventListener("gestureend", handleGestureEnd);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("gesturestart", handleGestureStart);
      window.removeEventListener("gesturechange", handleGestureChange);
      window.removeEventListener("gestureend", handleGestureEnd);
    };
  }, [isLoaded]);

  // --- Initial load ---
  useEffect(() => {
    (async () => {
      await loadBatch(0);
      setIsLoaded(true);
    })();

    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";
    document.body.style.background = "black";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        background: "#000",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />
      {!isLoaded && (
        <div
          style={{
            color: "white",
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
          }}
        >
          Loading frames... {Math.round((loadedFrames / TOTAL_FRAMES) * 100)}%
        </div>
      )}
      {isLoaded && (
        <div
          style={{
            position: "fixed",
            top: 20,
            left: 20,
            background: "rgba(0,0,0,0.6)",
            padding: 10,
            borderRadius: 8,
            color: "#fff",
            fontFamily: "sans-serif",
          }}
        >
          <div>📱 Pinch to zoom</div>
          <div>🖱️ Scroll or arrow keys</div>
          <div>
            Frame: {Math.floor(zoomRef.current) + 1} / {TOTAL_FRAMES}
          </div>
        </div>
      )}
    </div>
  );
}

