import React from 'react';
import { PenLine, ArrowUpRight, Eye, ExternalLink } from 'lucide-react';
import ModalShell from '../common/ModalShell';
import ModalDarkHead from '../common/ModalDarkHead';

const PostModal = ({ open, onClose, post, navigate }) => (
  <ModalShell open={open} onClose={onClose} maxW="max-w-[420px]">
    <ModalDarkHead
      icon={PenLine}
      title={post?.title ?? ""}
      subtitle={post?.category}
      onClose={onClose}
    />
    
    <div className="px-6 py-5 space-y-2.5">
      <p className="text-[13px] text-stone-400 font-medium mb-4 leading-relaxed">
        Post content lives in the <strong className="text-[#0C0901] font-black">Blog Creator</strong>.
        Pick an action below.
      </p>

      <button
        onClick={() => { onClose(); navigate(`/admin/blog-creator/${post?.slug}`); }}
        className="w-full flex items-center justify-between px-5 py-4 bg-[#0C0901] hover:bg-stone-900 rounded-2xl text-white text-[13px] font-bold transition-all group/a hover:shadow-xl hover:shadow-black/20"
      >
        <span className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
            <PenLine size={14} className="text-amber-400" />
          </span>
          Edit post in Blog Creator
        </span>
        <ArrowUpRight size={15} className="text-stone-600 group-hover/a:text-amber-400 transition-colors" />
      </button>

      <button
        onClick={() => { onClose(); navigate(`/blog/${post?.slug}`); }}
        className="w-full flex items-center justify-between px-5 py-4 bg-stone-50 hover:bg-stone-100 rounded-2xl text-[#0C0901] text-[13px] font-bold transition-all group/b"
      >
        <span className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center">
            <Eye size={14} className="text-stone-500" />
          </span>
          View live post
        </span>
        <ExternalLink size={14} className="text-stone-300 group-hover/b:text-stone-500 transition-colors" />
      </button>
    </div>
    
    <div className="h-5" />
  </ModalShell>
);

export default PostModal;