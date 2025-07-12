

import { useState, useRef, useEffect, useCallback } from 'react';
import { AppState, View, Video, Stats, YouTubeState, Comment, CommentAuthor, AIAnalysis, StrategyIdea } from '../types.ts';
import { getAiClient } from '../ai.ts';
import { Type, GenerateContentResponse } from '@google/genai';
import { TokenResponse } from '@react-oauth/google';

const LOCAL_STORAGE_KEY = 'youtubeAutomationState';
const AUTOMATION_INTERVAL_MS = 1800000; // 30 minutes, for 2 videos per hour

const defaultState: AppState = {
    activeView: 'Dashboard',
    isAutomated: false,
    isGenerating: false,
    isConnecting: false,
    statsHistory: [],
    videos: [],
    selectedVideo: null,
    youtube: {
        connected: false,
        channelName: null,
        channelImage: null,
        accessToken: null,
        error: null,
        videoCount: null,
    },
    videoTopic: 'surprising historical facts',
    isFetchingComments: false,
    isReplying: null,
    commentError: null,
    lastAutomationTimestamp: null,
    isGeneratingStrategy: false,
    strategyNiche: 'surprising historical facts',
    strategyIdeas: [],
};

/**
 * A robust helper function to parse JSON from a Gemini response,
 * handling markdown code block formatting.
 * @param responseText The raw text from the AI response.
 * @returns The parsed JSON object.
 */
const parseGeminiResponse = <T>(responseText: string): T => {
    let parsedText = responseText.trim();
    if (parsedText.startsWith("```json")) {
        // Extracts the JSON part from a markdown code block
        parsedText = parsedText.substring(7, parsedText.length - 3).trim();
    } else if (parsedText.startsWith("```")) {
        // Handles cases with just ``` as delimiters
        parsedText = parsedText.substring(3, parsedText.length - 3).trim();
    }
    try {
        return JSON.parse(parsedText);
    } catch (e) {
        console.error("Failed to parse Gemini JSON response:", parsedText);
        if (e instanceof SyntaxError) {
             throw new Error(`AI returned malformed JSON. Raw response: ${parsedText}`);
        }
        throw e; // re-throw other errors
    }
};


/**
 * Creates a video from a script and images using the Canvas API and MediaRecorder.
 * This version is enhanced for robustness and compatibility.
 * @param title The title of the video.
 * @param script An array of strings, where each string is a scene in the video.
 * @param imageBytesArray An array of base64 encoded image bytes.
 * @returns A Promise that resolves with a Blob containing the video data.
 */
const createVideoFromScript = (title: string, script: string[], imageBytesArray: string[]): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
        try {
            const width = 1080;
            const height = 1920; // Portrait for YouTube Shorts
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            if (typeof canvas.captureStream !== 'function') {
                return reject(new Error('Your browser does not support canvas.captureStream(). Please try a different browser like Chrome or Firefox.'));
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not create canvas context'));

            const images = await Promise.all(
                imageBytesArray.map(bytes => new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error('Image load error: could not load one of the generated images.'));
                    img.src = `data:image/png;base64,${bytes}`;
                }))
            );

            const stream = canvas.captureStream(30); // 30 FPS
            
            try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const destination = audioContext.createMediaStreamDestination();
                stream.addTrack(destination.stream.getAudioTracks()[0]);
            } catch (e) {
                console.warn("Could not add a silent audio track. The resulting video may have compatibility issues.", e);
            }
            
            if (typeof window.MediaRecorder === 'undefined') {
                return reject(new Error('Your browser does not support the MediaRecorder API. Please try a different browser like Chrome or Firefox.'));
            }
            
            const mimeTypes = [
                'video/webm;codecs=vp9,opus',
                'video/webm;codecs=vp8,opus',
                'video/webm;codecs=vp9',
                'video/webm;codecs=vp8',
                'video/webm',
            ];

            const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
            
            if (!supportedMimeType) {
                 return reject(new Error(`Your browser does not support the required video codecs. Please try a different browser.`));
            }

            const recorder = new MediaRecorder(stream, { mimeType: supportedMimeType });

            const chunks: BlobPart[] = [];
            recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
            recorder.onstop = () => {
                const blobMimeType = supportedMimeType.split(';')[0];
                resolve(new Blob(chunks, { type: blobMimeType }));
            };
            recorder.onerror = (e: Event) => reject(new Error(`MediaRecorder error: ${(e as any).error?.message || 'Unknown error'}`));

            const drawFrame = (text: string, image: HTMLImageElement | null) => {
                const gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, '#1e3a8a');
                gradient.addColorStop(1, '#111827');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                
                if (image) {
                    const imgAspectRatio = image.width / image.height;
                    const canvasAspectRatio = width / height;
                    let sx, sy, sWidth, sHeight;

                    if (imgAspectRatio > canvasAspectRatio) { // image is wider
                        sHeight = image.height;
                        sWidth = sHeight * canvasAspectRatio;
                        sx = (image.width - sWidth) / 2;
                        sy = 0;
                    } else { // image is taller or same ratio
                        sWidth = image.width;
                        sHeight = sWidth / canvasAspectRatio;
                        sx = 0;
                        sy = (image.height - sHeight) / 2;
                    }
                    ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, width, height);
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.fillRect(0, 0, width, height);
                }

                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                const words = text.split(' ');
                let line = '';
                const lines = [];
                const maxWidth = width * 0.9;
                ctx.font = 'bold 80px Inter, sans-serif';

                for(const word of words) {
                  const testLine = line + word + ' ';
                  if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
                    lines.push(line);
                    line = word + ' ';
                  } else {
                    line = testLine;
                  }
                }
                lines.push(line);

                const lineHeight = 100;
                const startY = (height - (lines.length - 1) * lineHeight) / 2;
                ctx.shadowColor = 'black';
                ctx.shadowBlur = 15;
                lines.forEach((l, i) => ctx.fillText(l.trim(), width / 2, startY + i * lineHeight));
                ctx.shadowBlur = 0;
            };
            
            const scenes = [title, ...script];
            const sceneDuration = 3000;
            let sceneIndex = 0;
            
            recorder.start();

            const renderNextScene = () => {
                if (sceneIndex < scenes.length) {
                    const image = images[sceneIndex];
                    drawFrame(scenes[sceneIndex], image);
                    sceneIndex++;
                    setTimeout(renderNextScene, sceneDuration);
                } else {
                    setTimeout(() => recorder.stop(), 100);
                }
            };
            renderNextScene();
        } catch(error) {
            reject(error);
        }
    });
};

const uploadVideoToYouTube = async (video: Omit<Video, 'id' | 'thumbnail'>, videoBlob: Blob, accessToken: string): Promise<string> => {
    const metadata = {
        snippet: {
            title: video.title,
            description: video.description,
            tags: video.tags,
            categoryId: '28', // Science & Technology
        },
        status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
    };
    const initResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
    });
    if (!initResponse.ok) throw new Error(`YouTube upload initiation failed: ${await initResponse.text()}`);
    
    const location = initResponse.headers.get('Location');
    if (!location) throw new Error('YouTube did not return a resumable upload location.');
    
    const uploadResponse = await fetch(location, { method: 'PUT', body: videoBlob });
    if (!uploadResponse.ok) throw new Error(`YouTube video upload failed: ${await uploadResponse.text()}`);
    
    const uploadResult = await uploadResponse.json();
    if (!uploadResult?.id) {
        throw new Error(`YouTube upload succeeded but the API response did not contain a video ID. Full response: ${JSON.stringify(uploadResult)}`);
    }
    
    return uploadResult.id;
};


export const useYouTubeAutomation = () => {
    const [state, setState] = useState<AppState>(() => {
        try {
            const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedState) {
                const parsed = JSON.parse(savedState);
                // Ensure transient state fields are reset on load
                const mergedState = { ...defaultState, ...parsed };
                mergedState.isGenerating = false;
                mergedState.isConnecting = false;
                mergedState.selectedVideo = null;
                mergedState.isGeneratingStrategy = false;
                mergedState.isFetchingComments = false;
                mergedState.isReplying = null;
                mergedState.commentError = null;
                return mergedState;
            }
        } catch (error) { console.error('Could not load state', error); }
        return defaultState;
    });

    const automationTimeout = useRef<number | null>(null);
    const stateRef = useRef(state);
    stateRef.current = state;

    useEffect(() => {
        try {
            const stateToSave = { ...state };
            // Don't persist transient state
            delete (stateToSave as any).selectedVideo;
            delete (stateToSave as any).isGenerating;
            delete (stateToSave as any).isConnecting;
            delete (stateToSave as any).isFetchingComments;
            delete (stateToSave as any).isReplying;
            delete (stateToSave as any).commentError;
            delete (stateToSave as any).isGeneratingStrategy;
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (error) { console.error('Could not save state', error); }
    }, [state]);
    
    const updateState = (updater: (prevState: AppState) => AppState) => setState(updater);

    const setActiveView = (view: View) => updateState(s => ({ ...s, activeView: view }));
    const setSelectedVideo = (video: Video | null) => updateState(s => ({ ...s, selectedVideo: video, commentError: null }));
    const setVideoTopic = (topic: string) => updateState(s => ({ ...s, videoTopic: topic }));
    const setStrategyNiche = (niche: string) => updateState(s => ({ ...s, strategyNiche: niche }));

    const fetchYouTubeProfile = useCallback(async (accessToken: string) => {
        const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!response.ok) throw new Error('Failed to fetch YouTube profile.');
        const data = await response.json();
        if (data.items.length > 0) {
            const { title, thumbnails } = data.items[0].snippet;
            return { channelName: title, channelImage: thumbnails.default.url };
        }
        return { channelName: 'Unknown Channel', channelImage: null };
    }, []);

    const _fetchYouTubeStats = useCallback(async (accessToken: string) => {
        try {
            const channelResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=contentDetails,statistics&mine=true', {
                 headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!channelResponse.ok) throw new Error('Failed to fetch channel details.');
            const channelData = await channelResponse.json();
            const channelInfo = channelData.items[0];
            if (!channelInfo) return;

            const videoCount = parseInt(channelInfo.statistics.videoCount || '0', 10);
            const totalComments = parseInt(channelInfo.statistics.commentCount || '0', 10);
            const uploadsPlaylistId = channelInfo.contentDetails.relatedPlaylists.uploads;

            // Fetch ALL video IDs using pagination
            const allVideoIds: string[] = [];
            let nextPageToken: string | undefined = undefined;
            do {
                const playlistItemsResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                if (!playlistItemsResponse.ok) throw new Error(`Failed to fetch playlist items: ${await playlistItemsResponse.text()}`);
                const playlistData = await playlistItemsResponse.json();
                
                playlistData.items.forEach((item: any) => allVideoIds.push(item.contentDetails.videoId));
                nextPageToken = playlistData.nextPageToken;
            } while (nextPageToken);

            let totalViews = 0;
            let totalLikes = 0;
            const videoStatsMap = new Map();
            
            // Fetch video stats in batches of 50
            for (let i = 0; i < allVideoIds.length; i += 50) {
                const videoIdsChunk = allVideoIds.slice(i, i + 50);
                const videosResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIdsChunk.join(',')}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                if (!videosResponse.ok) throw new Error(`Failed to fetch video statistics: ${await videosResponse.text()}`);
                const videosData = await videosResponse.json();
                
                videosData.items.forEach((item: any) => {
                    const stats = {
                        views: parseInt(item.statistics.viewCount || '0', 10),
                        likes: parseInt(item.statistics.likeCount || '0', 10),
                        comments: parseInt(item.statistics.commentCount || '0', 10),
                    };
                    totalViews += stats.views;
                    totalLikes += stats.likes;
                    videoStatsMap.set(item.id, stats);
                });
            }
            
            updateState(s => {
                const newStats: Stats = { name: new Date().toLocaleTimeString(), videos: videoCount, views: totalViews, likes: totalLikes, comments: totalComments };
                const newStatsHistory = [...s.statsHistory, newStats].slice(-10);
                
                const updatedVideos = s.videos.map(video => {
                    if (video.youtubeVideoId && videoStatsMap.has(video.youtubeVideoId)) {
                        const newVideoStats = videoStatsMap.get(video.youtubeVideoId);
                        return { ...video, ...newVideoStats };
                    }
                    return video;
                });

                return { ...s, statsHistory: newStatsHistory, videos: updatedVideos, youtube: {...s.youtube, videoCount: videoCount } };
            });

        } catch (error) {
            console.error("Error fetching YouTube stats:", error);
        }
    }, []);
    
    const generateAndAddVideo = useCallback(async (isAutomatedRun: boolean = false) => {
        const currentState = stateRef.current;
        if (currentState.isGenerating || !currentState.youtube.connected || !currentState.youtube.accessToken) return;

        updateState(s => ({ ...s, isGenerating: true }));
        const tempVideoId = `vid_${Date.now()}`;
        
        updateState(s => ({
            ...s,
            videos: [{
                id: tempVideoId,
                title: `Generating: ${s.videoTopic}`,
                script: [],
                description: "AI is generating content...",
                tags: [],
                uploadDate: new Date().toISOString(),
                views: 0, likes: 0, comments: 0,
                status: 'Processing',
                thumbnail: `https://via.placeholder.com/320x180/1e293b/94a3b8?text=Generating...`
            }, ...s.videos]
        }));

        try {
            const ai = getAiClient();
            const prompt = `Generate content for a viral YouTube Shorts video about ${currentState.videoTopic}. Focus on creating a narrative that is engaging and visually compelling. The content must be factual, interesting, and easy to digest.`;
            
            const contentResponse: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: "A short, catchy, viral-style title for a YouTube Short (under 70 characters)." },
                            script: { type: Type.ARRAY, items: { type: Type.STRING }, description: "The script for the video, broken down into exactly 5 short, punchy sentences or points. Each point will be a scene." },
                            description: { type: Type.STRING, description: "An SEO-optimized YouTube description. Include a brief summary, relevant hashtags (e.g., #shorts #facts), and a call to action." },
                            tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 5-10 relevant SEO tags to improve discovery." },
                            imagePrompts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of exactly 6 descriptive, artistic, and visually stunning image generation prompts that correspond to the title and the 5 script points." }
                        },
                        required: ["title", "script", "description", "tags", "imagePrompts"]
                    }
                }
            });
    
            const generatedContent = parseGeminiResponse<{
                title: string;
                script: string[];
                description: string;
                tags: string[];
                imagePrompts: string[];
            }>(contentResponse.text);
    
            if (!generatedContent.title || !Array.isArray(generatedContent.script) || generatedContent.script.length !== 5 || !Array.isArray(generatedContent.imagePrompts) || generatedContent.imagePrompts.length !== 6) {
                throw new Error("AI returned data in an invalid format. Expected 5 script points and 6 image prompts.");
            }
    
            const newVideoData: Omit<Video, 'id' | 'thumbnail' | 'status'> = { title: generatedContent.title, script: generatedContent.script, description: generatedContent.description, tags: generatedContent.tags, uploadDate: new Date().toISOString(), views: 0, likes: 0, comments: 0 };
            updateState(s => ({ ...s, videos: s.videos.map(v => v.id === tempVideoId ? { ...v, ...newVideoData, status: 'Processing' } : v) }));
    
            const imagePromises = generatedContent.imagePrompts.map((p: string) => ai.models.generateImages({ model: 'imagen-3.0-generate-002', prompt: p, config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '9:16' } }));
            const imageResults = await Promise.all(imagePromises);
            const imageBytesArray = imageResults.map(res => res.generatedImages[0].image.imageBytes);
            
            const tempThumbnail = `data:image/png;base64,${imageBytesArray[0]}`;
            updateState(s => ({ ...s, videos: s.videos.map(v => v.id === tempVideoId ? { ...v, status: 'Generated', thumbnail: tempThumbnail } : v) }));
    
            const videoBlob = await createVideoFromScript(generatedContent.title, generatedContent.script, imageBytesArray);
            updateState(s => ({ ...s, videos: s.videos.map(v => v.id === tempVideoId ? { ...v, status: 'Uploading' } : v) }));
    
            const youtubeVideoId = await uploadVideoToYouTube({ ...newVideoData, uploadDate: new Date().toISOString(), views: 0, likes: 0, comments: 0, status: 'Uploading' }, videoBlob, currentState.youtube.accessToken!);
            const finalThumbnailUrl = `https://i.ytimg.com/vi/${youtubeVideoId}/mqdefault.jpg`;
            
            updateState(s => ({
                ...s,
                isGenerating: false,
                videos: s.videos.map(v => v.id === tempVideoId ? { ...v, id: youtubeVideoId, youtubeVideoId, status: 'Uploaded', thumbnail: finalThumbnailUrl } : v),
                lastAutomationTimestamp: isAutomatedRun ? Date.now() : s.lastAutomationTimestamp,
            }));
    
            await _fetchYouTubeStats(currentState.youtube.accessToken!);
        } catch (error) {
            console.error("Video generation failed:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            updateState(s => ({ ...s, isGenerating: false, videos: s.videos.map(v => v.id === tempVideoId ? { ...v, status: 'Failed', description: errorMessage } : v) }));
        }
    }, [_fetchYouTubeStats]);

    const stopAutomation = useCallback(() => {
        if (automationTimeout.current) {
            clearTimeout(automationTimeout.current);
            automationTimeout.current = null;
        }
        updateState(s => ({ ...s, isAutomated: false }));
    }, []);

    const scheduleNextAutomatedRun = useCallback(() => {
        if (automationTimeout.current) clearTimeout(automationTimeout.current);

        const { isAutomated, youtube, lastAutomationTimestamp } = stateRef.current;
        if (!isAutomated || !youtube.connected) {
            stopAutomation();
            return;
        }
        
        const run = async () => {
            await generateAndAddVideo(true);
            scheduleNextAutomatedRun();
        };

        let delay = AUTOMATION_INTERVAL_MS;
        if (lastAutomationTimestamp) {
            const timeSince = Date.now() - lastAutomationTimestamp;
            delay = Math.max(0, AUTOMATION_INTERVAL_MS - timeSince);
        } else {
            delay = 0; // First run is immediate if no timestamp exists
        }
        
        automationTimeout.current = setTimeout(run, delay) as any;
    }, [generateAndAddVideo, stopAutomation]);

    const startAutomation = useCallback(() => {
        updateState(s => ({ ...s, isAutomated: true }));
        scheduleNextAutomatedRun();
    }, [scheduleNextAutomatedRun]);
    
    const toggleAutomation = () => {
        const { isAutomated, youtube } = stateRef.current;
        if (!youtube.connected) return;

        if (isAutomated) {
            stopAutomation();
        } else {
            startAutomation();
        }
    };
    
    const handleDisconnect = useCallback(() => {
        // Clear any running automation timers
        if (automationTimeout.current) {
            clearTimeout(automationTimeout.current);
            automationTimeout.current = null;
        }
        // Perform a single, atomic state update to reset all relevant fields
        updateState(s => ({ 
            ...s, 
            isAutomated: false,
            lastAutomationTimestamp: null,
            youtube: defaultState.youtube, 
            statsHistory: [], 
            videos: s.videos.map(v => ({...v, views:0, likes:0, comments:0})) 
        }));
    }, []);

    const handleConnectSuccess = useCallback(async (tokenResponse: Pick<TokenResponse, 'access_token'>) => {
        updateState(s => ({ ...s, isConnecting: true, youtube: { ...defaultState.youtube, accessToken: tokenResponse.access_token }}));
        try {
            const profile = await fetchYouTubeProfile(tokenResponse.access_token);
            updateState(s => ({
                ...s,
                isConnecting: false,
                youtube: { ...s.youtube, connected: true, ...profile, error: null }
            }));
            await _fetchYouTubeStats(tokenResponse.access_token);
        } catch (error) {
            handleDisconnect();
            updateState(s => ({ ...s, isConnecting: false, youtube: { ...s.youtube, error: 'Could not connect to YouTube. Please try again.' }}));
        }
    }, [fetchYouTubeProfile, _fetchYouTubeStats, handleDisconnect]);

    const handleConnectError = useCallback((error: any) => {
        console.error('Google Login Error:', error);
        updateState(s => ({ ...s, isConnecting: false, youtube: { ...defaultState.youtube, error: 'Failed to connect to Google.' } }));
    }, []);
    
    // Auto-reconnect on load and clean up on unmount
    useEffect(() => {
        const reconnect = async () => {
            if (state.youtube.accessToken && !state.youtube.connected) {
                await handleConnectSuccess({ access_token: state.youtube.accessToken });
            }
        };
        reconnect();

        // Cleanup function to stop automation when the component unmounts
        return () => {
            if (automationTimeout.current) {
                clearTimeout(automationTimeout.current);
            }
        };
    }, []);

    // Effect to restart automation if it was active on page load
    useEffect(() => {
        if (state.isAutomated && state.youtube.connected) {
            scheduleNextAutomatedRun();
        }
    }, [state.isAutomated, state.youtube.connected, scheduleNextAutomatedRun]);


    const fetchCommentsForVideo = useCallback(async (youtubeVideoId: string) => {
        const { youtube } = stateRef.current;
        if (!youtube.connected || !youtube.accessToken) return;
        
        updateState(s => ({ ...s, isFetchingComments: true, commentError: null }));
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${youtubeVideoId}&maxResults=50&order=relevance`, {
                headers: { 'Authorization': `Bearer ${youtube.accessToken}` }
            });
            if (!response.ok) throw new Error(`Failed to fetch comments: ${await response.text()}`);
            const data = await response.json();
            
            const comments: Comment[] = (data.items || []).map((item: any) => {
                const snippet = item.snippet.topLevelComment.snippet;
                const author: CommentAuthor = {
                    name: snippet.authorDisplayName,
                    imageUrl: snippet.authorProfileImageUrl,
                    channelUrl: snippet.authorChannelUrl
                };
                return {
                    id: item.snippet.topLevelComment.id,
                    text: snippet.textDisplay,
                    author: author,
                    publishedAt: snippet.publishedAt,
                    likeCount: snippet.likeCount,
                };
            });

            updateState(s => {
                const updatedVideos = s.videos.map(v => v.youtubeVideoId === youtubeVideoId ? { ...v, commentThreads: comments } : v);
                const updatedSelectedVideo = s.selectedVideo?.youtubeVideoId === youtubeVideoId ? { ...s.selectedVideo, commentThreads: comments } : s.selectedVideo;
                return { ...s, videos: updatedVideos, selectedVideo: updatedSelectedVideo, isFetchingComments: false };
            });

        } catch (error) {
            console.error("Error fetching comments:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            updateState(s => ({ ...s, isFetchingComments: false, commentError: errorMessage }));
        }
    }, []);

    const generateReplySuggestion = useCallback(async (commentId: string, commentText: string) => {
        updateState(s => ({ ...s, isReplying: commentId, commentError: null }));
        try {
             const ai = getAiClient();
             const prompt = `Your task is to analyze a YouTube comment's sentiment and generate a suitable reply. The channel's tone is informative and enthusiastic about interesting facts. First, classify the comment's sentiment. You MUST choose one of the following exact categories: 'Positive', 'Negative', 'Question', 'Neutral', 'Spam'. Second, based on the sentiment, write a friendly, concise, and engaging reply. Comment to analyze: "${commentText}"`;
             
             const contentResponse: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            sentiment: { 
                                type: Type.STRING, 
                                description: "The sentiment of the comment. MUST be one of: 'Positive', 'Negative', 'Question', 'Neutral', 'Spam'." 
                            },
                            suggestedReply: { 
                                type: Type.STRING, 
                                description: "A friendly, on-brand reply to the comment." 
                            }
                        },
                        required: ["sentiment", "suggestedReply"]
                    }
                }
            });

            const aiAnalysis = parseGeminiResponse<AIAnalysis>(contentResponse.text);

            if (!aiAnalysis.sentiment || !aiAnalysis.suggestedReply) {
                throw new Error("AI returned data in an invalid format. Expected sentiment and suggestedReply.");
            }

            updateState(s => {
                if (!s.selectedVideo) return { ...s, isReplying: null };

                const updateComments = (comments: Comment[] | undefined) => comments?.map(c => 
                    c.id === commentId ? { ...c, aiAnalysis } : c
                );

                const updatedSelectedVideo = { ...s.selectedVideo, commentThreads: updateComments(s.selectedVideo.commentThreads) };
                
                const updatedVideos = s.videos.map(v => 
                    v.id === s.selectedVideo!.id ? updatedSelectedVideo : v
                );

                return { ...s, videos: updatedVideos, selectedVideo: updatedSelectedVideo, isReplying: null };
            });
        } catch (error) {
            console.error("Error generating reply:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            updateState(s => ({ ...s, isReplying: null, commentError: errorMessage }));
        }
    }, []);

    const postYouTubeReply = useCallback(async (parentId: string, replyText: string) => {
        const { youtube } = stateRef.current;
        if (!youtube.connected || !youtube.accessToken || !stateRef.current.selectedVideo) return;
        
        updateState(s => ({ ...s, isReplying: parentId, commentError: null }));

        try {
            const body = {
                snippet: {
                    textOriginal: replyText,
                    parentId: parentId,
                }
            };
            const response = await fetch('https://www.googleapis.com/youtube/v3/comments?part=snippet', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${youtube.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to post reply: ${errorData.error.message}`);
            }
            
            updateState(s => {
                if (!s.selectedVideo) return s;
                const videoId = s.selectedVideo.id;

                const updateComments = (comments: Comment[] | undefined) => comments?.map(c => 
                    c.id === parentId ? { ...c, replyPosted: true } : c
                );

                const updatedSelectedVideo = { ...s.selectedVideo, commentThreads: updateComments(s.selectedVideo.commentThreads) };
                const updatedVideos = s.videos.map(v => v.id === videoId ? updatedSelectedVideo : v);

                return { ...s, videos: updatedVideos, selectedVideo: updatedSelectedVideo, isReplying: null };
            });

        } catch(error) {
             console.error("Error posting reply:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            updateState(s => ({ ...s, isReplying: null, commentError: errorMessage }));
        }
    }, []);

    const generateContentStrategy = useCallback(async () => {
        const { youtube, strategyNiche } = stateRef.current;
        if (!youtube.connected || !strategyNiche) return;

        updateState(s => ({ ...s, isGeneratingStrategy: true, strategyIdeas: [] }));

        try {
            const ai = getAiClient();
            const prompt = `Act as an expert YouTube growth strategist. Your goal is to create a content plan with 6 viral video ideas for a channel focused on "${strategyNiche}". For each idea, provide a catchy, SEO-friendly title, a brief concept explaining the video's angle, and a compelling reason why this idea has high viral potential (e.g., relates to a current trend, answers a common question, has a strong emotional hook).`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING, description: "A catchy, SEO-friendly title for the YouTube video." },
                                concept: { type: Type.STRING, description: "A brief concept (1-2 sentences) explaining the video's core idea or angle." },
                                reason: { type: Type.STRING, description: "A compelling reason why this video idea has high viral potential." }
                            },
                            required: ["title", "concept", "reason"]
                        }
                    }
                }
            });
            
            const ideas = parseGeminiResponse<StrategyIdea[]>(response.text);
            
            updateState(s => ({ ...s, strategyIdeas: ideas, isGeneratingStrategy: false }));

        } catch (error) {
            console.error("Error generating content strategy:", error);
            updateState(s => ({...s, isGeneratingStrategy: false}));
        }
    }, []);

    const selectStrategyIdea = useCallback((idea: StrategyIdea) => {
        updateState(s => ({
            ...s,
            activeView: 'Dashboard',
            videoTopic: idea.title,
        }));
    }, []);



    return {
        state,
        toggleAutomation,
        generateAndAddVideo,
        setActiveView,
        setSelectedVideo,
        fetchYouTubeStats: () => state.youtube.accessToken && _fetchYouTubeStats(state.youtube.accessToken),
        handleConnectSuccess,
        handleConnectError,
        handleDisconnect,
        setVideoTopic,
        fetchCommentsForVideo,
        generateReplySuggestion,
        postYouTubeReply,
        setStrategyNiche,
        generateContentStrategy,
        selectStrategyIdea,
    };
};