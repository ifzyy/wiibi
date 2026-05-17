import { ChevronLeft, ChevronRight, ImageOff, Share2 } from 'lucide-react';

const ProductImages = ({ images, activeImg, setActiveImg }) => {
  const mainImg = images[activeImg];

  return (
    <div className="flex gap-4">
      {/* Thumbnail column */}
      <div className="flex flex-col gap-3 flex-shrink-0">
        {images.slice(0, 3).map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveImg(i)}
            className={`w-[130px] h-[130px] rounded-2xl overflow-hidden border-2 transition-all bg-gray-50 ${
              activeImg === i ? 'border-[#FFAA14]' : 'border-gray-100 hover:border-gray-300'
            }`}
          >
            <img src={img} alt="" className="w-full h-full object-cover mix-blend-multiply" />
          </button>
        ))}

        {/* "See All" or empty pad */}
        <button
          onClick={() => images.length > 3 && setActiveImg(3)}
          className="w-[130px] h-[130px] rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center hover:border-gray-300 transition-all"
        >
          <span className="text-sm font-semibold text-gray-400">See All</span>
        </button>
      </div>

      {/* Main image + controls */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex-1 bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 aspect-square">
          {mainImg ? (
            <img
              src={mainImg}
              alt="Product"
              className="w-full h-full object-cover mix-blend-multiply"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ImageOff size={48} />
            </div>
          )}
        </div>

        {/* Share / dots / arrows row */}
        <div className="flex items-center justify-between px-1">
          <button className="flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all">
            <Share2 size={13} /> Share
          </button>

          <div className="flex gap-1.5 items-center">
            {Array.from({ length: Math.max(images.length, 6) }, (_, i) => (
              <button
                key={i}
                onClick={() => i < images.length && setActiveImg(i)}
                className={`rounded-full w-2 h-2 transition-all ${
                  activeImg === i ? 'bg-[#FFAA14]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveImg((p) => Math.max(0, p - 1))}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-black hover:border-gray-400 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setActiveImg((p) => Math.min(images.length - 1, p + 1))}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-black hover:border-gray-400 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductImages;
