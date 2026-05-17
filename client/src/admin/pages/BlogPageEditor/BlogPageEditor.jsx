import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';

import { useToast, ToastStack } from './components/common/Toast';
import { PageSkeleton } from './components/common/Skeleton';
import SaveBar from './components/common/SaveBar';
import EditorTopBar from './components/sections/EditorTopBar';
import HeaderSection from './components/sections/HeaderSection';
import CategoryBar from './components/sections/CategoryBar';
import PostsGrid from './components/sections/PostsGrid';
import CategoryModal from './components/modals/CategoryModal';
import PostModal from './components/modals/PostModal';

import { useBlogPageEditor } from './hooks/useBlogPageEditor';

const BlogPageEditor = () => {
  const navigate = useNavigate();
  const { toasts, push: toast } = useToast();
  
  const {
    // Loading states
    pageLoading,
    postsLoading,
    pageError,
    pageData,
    
    // Data
    visiblePosts,
    
    // Editor state
    subHeading,
    setSubHeading,
    mainHeading,
    setMainHeading,
    categories,
    activeCategory,
    setActiveCategory,
    
    // Dirty tracking
    dirty,
    saving,
    handleSave,
    handleDiscard,
    
    // Modals
    catModalOpen,
    setCatModalOpen,
    activePost,
    setActivePost,
    handleCategoriesSave,
  } = useBlogPageEditor(toast);

  if (pageLoading) return <PageSkeleton />;
  
  if (pageError || !pageData) {
    return (
      <div className="pt-10 p-20 text-center text-stone-400 text-sm">
        Page data unavailable.
      </div>
    );
  }

  return (
    <>
      {/* <EditorTopBar dirty={dirty} /> */}

      <main className="bg-white min-h-screen pt-11">
        <HeaderSection
          subHeading={subHeading}
          onSubHeadingChange={setSubHeading}
          mainHeading={mainHeading}
          onMainHeadingChange={setMainHeading}
        />

        <div className="border border-[#f1f1f1] mb-10" />

        <CategoryBar
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onManageClick={() => setCatModalOpen(true)}
        />

        <section className="max-w-7xl mx-auto px-6 pb-44">
          {/* Editor hint */}
          <div className="flex items-center gap-2 mb-10 px-3.5 py-2 bg-[#0C0901]/[0.03] border border-stone-100 rounded-xl w-fit text-[11px] text-stone-400 font-semibold">
            <LayoutGrid size={11} className="text-amber-400" />
            Post content is managed in the Blog Creator — hover a card to open
          </div>

          <PostsGrid
            posts={visiblePosts}
            loading={postsLoading}
            onPostClick={setActivePost}
            onViewAll={() => setActiveCategory("All")}
            activeCategory={activeCategory}
          />
        </section>
      </main>

      {/* Modals */}
      <CategoryModal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        categories={categories}
        onSave={handleCategoriesSave}
      />

      <PostModal
        open={!!activePost}
        onClose={() => setActivePost(null)}
        post={activePost}
        navigate={navigate}
      />

      {/* Save Bar */}
      <SaveBar 
        dirty={dirty} 
        saving={saving} 
        onSave={handleSave} 
        onDiscard={handleDiscard} 
      />

      {/* Toasts */}
      <ToastStack toasts={toasts} />
    </>
  );
};

export default BlogPageEditor;