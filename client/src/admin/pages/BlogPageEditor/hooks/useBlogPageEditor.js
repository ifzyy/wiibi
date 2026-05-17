import { useState, useEffect, useCallback } from 'react';
import { usePage, useBlogPosts } from '../../../../hooks/queries';
import { callUpdateSection } from '../utils/api';
import { DEFAULT_CATEGORIES, BLOG_GRID_SECTION_TYPE } from '../types';

export const useBlogPageEditor = (toast) => {
  const { data: pageData, isLoading: pageLoading, isError: pageError } = usePage("blog");
  const { data: postsData, isLoading: postsLoading } = useBlogPosts({ limit: 100 });

  // Derive section once
  const section = pageData?.sections?.find(s => s.type === BLOG_GRID_SECTION_TYPE);
  const sectionContent = section?.content ?? {};

  // Local editable state
  const [subHeading, setSubHeading] = useState("");
  const [mainHeading, setMainHeading] = useState("");
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState("All");

  // Dirty tracking
  const [savedSnap, setSavedSnap] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modals
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [activePost, setActivePost] = useState(null);

  // Seed from API on load
  useEffect(() => {
    if (!pageData || savedSnap) return;
    
    const h = sectionContent.header ?? {};
    const cats = Array.isArray(sectionContent.categories) 
      ? sectionContent.categories 
      : DEFAULT_CATEGORIES;
    
    const snap = {
      subHeading: h.sub_heading ?? "Our Voice",
      mainHeading: h.main_heading ?? "Blog",
      categories: cats,
    };
    
    setSubHeading(snap.subHeading);
    setMainHeading(snap.mainHeading);
    setCategories(snap.categories);
    setSavedSnap(snap);
  }, [pageData]); // eslint-disable-line

  // Dirty flag
  useEffect(() => {
    if (!savedSnap) return;
    
    setDirty(
      subHeading !== savedSnap.subHeading ||
      mainHeading !== savedSnap.mainHeading ||
      JSON.stringify(categories) !== JSON.stringify(savedSnap.categories)
    );
  }, [subHeading, mainHeading, categories, savedSnap]);

  const handleSave = async () => {
    if (!section?.id) {
      toast("Cannot find section ID — check page data", "error");
      return;
    }
    
    setSaving(true);
    
    try {
      // Merge with existing content to preserve posts + any other keys
      const newContent = {
        ...sectionContent,
        header: { sub_heading: subHeading, main_heading: mainHeading },
        categories,
      };
      
      await callUpdateSection(section.id, newContent);
      
      const snap = { subHeading, mainHeading, categories: [...categories] };
      setSavedSnap(snap);
      setDirty(false);
      toast("Saved successfully ✦");
    } catch (e) {
      toast(e.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!savedSnap) return;
    
    setSubHeading(savedSnap.subHeading);
    setMainHeading(savedSnap.mainHeading);
    setCategories([...savedSnap.categories]);
    setActiveCategory("All");
    setDirty(false);
  };

  // Filter posts by active category
  const allPosts = postsData?.blogs ?? postsData ?? [];
  const visiblePosts = activeCategory === "All"
    ? allPosts
    : allPosts.filter(p => p.category === activeCategory);

  const handleCategoriesSave = (newCategories) => {
    setCategories(newCategories);
    setActiveCategory("All");
  };

  return {
    // Loading states
    pageLoading,
    postsLoading,
    pageError,
    pageData,
    
    // Data
    allPosts,
    visiblePosts,
    section,
    sectionContent,
    
    // Editor state
    subHeading,
    setSubHeading,
    mainHeading,
    setMainHeading,
    categories,
    setCategories,
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
  };
};