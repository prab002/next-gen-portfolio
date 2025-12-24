"use client";

import React, { useEffect, useState } from 'react';
import styles from './PortfolioTerminal.module.css';

interface BlogPost {
  title: string;
  pubDate: string;
  link: string;
  thumbnail: string;
  description: string;
  categories: string[];
}

export const BlogSection = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const RSS_URL = 'https://medium.com/feed/@prabhanjan002';
        const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`;
        
        const res = await fetch(API_URL);
        const data = await res.json();

        if (data.status === 'ok') {
          setPosts(data.items);
        } else {
          setError('Failed to retrieve neural feed.');
        }
      } catch (err) {
        setError('Network link interrupted.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className={styles.response}>
        <span className={styles.aiThinking}>RECEIVING DATA STREAM...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        ERROR: {error} <br/>
        Please verify coordinates: @prabhanjan002
      </div>
    );
  }

  return (
    <div className={styles.blogGrid}>
      <div className={styles.response} style={{ gridColumn: '1/-1', marginBottom: '1rem', color: '#e5e5e5' }}>
        Found {posts.length} articles in neural archive:
      </div>
      
      {posts.map((post, index) => {
        // 1. Try to get image from thumbnail field
        // 2. If missing, regex parse the first <img src> from description
        let imgUrl = post.thumbnail;
        if (!imgUrl) {
           const imgMatch = post.description.match(/<img[^>]+src="([^">]+)"/);
           if (imgMatch) {
               imgUrl = imgMatch[1];
           }
        }

        // Strip HTML tags for snippet
        const snippet = post.description.replace(/<[^>]+>/g, '').substring(0, 120) + '...';
        
        // Correct CSS syntax for HSL (removed the #)
        const fallbackGradient = `linear-gradient(135deg, hsl(${Math.random() * 360}, 50%, 20%), #000)`;
        
        return (
            <div key={index} className={styles.blogCard} onClick={() => window.open(post.link, '_blank')}>
              
              {/* Thumbnail Area */}
              <div 
                  className={styles.blogThumbnail}
                  style={{ 
                      backgroundImage: imgUrl ? `url(${imgUrl})` : fallbackGradient
                  }} 
              />

              {/* Content Area */}
              <div className={styles.blogContent}>
                  <div className={styles.blogDate}>
                      {new Date(post.pubDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className={styles.blogTitle}>
                      {post.title}
                  </div>
                  <div className={styles.blogSnippet}>
                      {snippet}
                  </div>
                  
                  <div className={styles.blogAction}>
                      [ACCESS_FILE] &gt;&gt;
                  </div>
              </div>

            </div>
        );
      })}
    </div>
  );
};
