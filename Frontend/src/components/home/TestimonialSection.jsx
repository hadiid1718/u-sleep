import { useState, useEffect } from 'react';
import { User, Play, Loader2 } from 'lucide-react';
import { reviewVideoAPI } from '../../services/reviewVideoService';

const TestimonialSection = () => {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const result = await reviewVideoAPI.getLatest();
        if (result.success && result.data?.data) {
          setVideo(result.data.data);
        }
      } catch (err) {
        console.error('Failed to load review video:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, []);

  // Extract YouTube/Vimeo embed URL from regular URL
  const getEmbedUrl = (url) => {
    if (!url) return null;
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    // Direct video URL — use <video> tag instead
    return null;
  };

  return (
    <section className="bg-black py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
          What our users say
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
          </div>
        ) : video ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col md:flex-row">
            {/* Video Player */}
            <div className="relative w-full md:w-1/2 aspect-video md:aspect-auto md:min-h-[280px] bg-gray-950 flex-shrink-0">
              {playing ? (
                getEmbedUrl(video.videoUrl) ? (
                  <iframe
                    className="w-full h-full absolute inset-0"
                    src={getEmbedUrl(video.videoUrl)}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    className="w-full h-full absolute inset-0 object-cover"
                    src={video.videoUrl}
                    controls
                    autoPlay
                  />
                )
              ) : (
                <button
                  onClick={() => setPlaying(true)}
                  className="w-full h-full group cursor-pointer relative"
                >
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover absolute inset-0"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-950 flex items-center justify-center">
                      <User className="w-16 h-16 text-gray-600" />
                    </div>
                  )}
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                    <div className="w-14 h-14 bg-lime-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-7 h-7 text-black ml-0.5" />
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Video Info */}
            <div className="p-6 md:p-8 flex flex-col justify-center flex-1">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-500 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white text-lg font-semibold">{video.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {video.reviewerName}
                    {video.reviewerRole && ` — ${video.reviewerRole}`}
                  </p>
                  {video.description && (
                    <p className="text-gray-300 text-sm mt-3">{video.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Fallback when no video is uploaded */
          <div className="bg-gray-900 p-8 rounded-xl border border-gray-800">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-red-500 rounded-lg flex-shrink-0 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white text-lg mb-4">
                  "Finally, I found a system that actually works. Save money with Al<br />
                  solutions."
                </p>
                <div className="flex items-center space-x-4">
                  <button className="bg-lime-400 text-black px-6 py-2 rounded-lg text-sm font-medium">
                    Start your free trial
                  </button>
                  <button className="text-lime-400 text-sm hover:underline">
                    View video case study →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default TestimonialSection;
