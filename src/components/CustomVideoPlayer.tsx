import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

interface CustomVideoPlayerProps {
    src: string;
    className?: string;
}

export default function CustomVideoPlayer({ src, className = "" }: CustomVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateProgress = () => {
            if (video.duration > 0) {
                setProgress((video.currentTime / video.duration) * 100);
            }
        };

        const handleEnded = () => setIsPlaying(false);

        video.addEventListener('timeupdate', updateProgress);
        video.addEventListener('ended', handleEnded);

        return () => {
            video.removeEventListener('timeupdate', updateProgress);
            video.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlay = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (videoRef.current?.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current?.pause();
            setIsPlaying(false);
        }
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const newTime = (Number(e.target.value) / 100) * videoRef.current.duration;
            videoRef.current.currentTime = newTime;
            setProgress(Number(e.target.value));
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleFullscreen = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <div ref={containerRef} className={`relative group bg-black overflow-hidden flex items-center justify-center ${className}`}>
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
                playsInline
            />
            
            {/* Play/Pause Overlay */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/50 text-white p-4 rounded-full backdrop-blur-sm animate-pulse shadow-lg">
                         <Play className="w-12 h-12 ml-1" />
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2">
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={progress}
                    onChange={handleProgressChange}
                    className="w-full h-1.5 bg-gray-500/50 rounded-lg appearance-none cursor-pointer accent-accent"
                />
                
                <div className="flex items-center justify-between text-white mt-2">
                    <button onClick={togglePlay} className="hover:text-accent transition">
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>
                    
                    <div className="flex items-center gap-4">
                        <button onClick={toggleMute} className="hover:text-accent transition">
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <button onClick={toggleFullscreen} className="hover:text-accent transition">
                            {isFullscreen ? <Maximize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
