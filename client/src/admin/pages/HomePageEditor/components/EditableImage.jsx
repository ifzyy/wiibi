/**
 * EditableImage.jsx
 *
 * Renders an image with a pencil edit button overlay.
 * Opens the ImageEditor modal when clicked.
 * Reports the new URL back via onUrlChange after a successful upload.
 */

import { useState } from "react";
import ImageEditor from "./ImageEditor";
import { ROLE } from "../api/homepageApi";

/**
 * @param {{
 *   src        : string | null,
 *   alt        : string,
 *   sectionId  : string,
 *   role       : string,        one of the ROLE constants
 *   onUrlChange: (newUrl: string) => void,
 *   className  : string,
 *   emptyLabel : string,        button text when no image is set
 * }} props
 */
const EditableImage = ({
  src,
  alt = "",
  sectionId,
  role = ROLE.HERO,
  onUrlChange,
  className = "",
  emptyLabel = "Add Image",
}) => {
  const [showEditor, setShowEditor] = useState(false);

  return (
    <div className="relative w-full h-full">

      {src ? (
        <>
          <img src={src} alt={alt} className={className} />
          <button
            onClick={() => setShowEditor(true)}
            title="Edit image"
            className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2.5 rounded-full shadow-lg hover:bg-[#FFAA14] hover:text-white transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-amber-50/60 rounded-xl">
          <button
            onClick={() => setShowEditor(true)}
            className="bg-white px-8 py-4 rounded-xl shadow font-bold text-sm uppercase tracking-widest text-gray-700 hover:bg-amber-50 border border-gray-200 transition"
          >
            {emptyLabel}
          </button>
        </div>
      )}

      {showEditor && (
        <ImageEditor
          sectionId={sectionId}
          role={role}
          currentUrl={src}
          onSuccess={(newUrl) => {
            onUrlChange(newUrl);
            setShowEditor(false);
          }}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
};

export default EditableImage;
