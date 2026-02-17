import { useState, useRef, useEffect } from "react";
import API from "../../api/axios";

export default function RecipesStream() {
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState([]);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const chatEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const MAX_IMAGES = 3;

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await API.get("/recipes/history");

      const formatted = res.data.messages.map(m => {
        let parsedRecipe = null;
        let displayText = m.text;

        if (m.role === "ai" && m.text) {
          try {
            const parsed = JSON.parse(m.text);
            if (parsed.recipe_name || parsed.ingredients || parsed.steps) {
              parsedRecipe = parsed;
              displayText = null;
            }
          } catch (e) {
            displayText = m.text;
          }
        }

        return {
          type: m.role,
          text: displayText,
          recipe: parsedRecipe,
          images: m.imageUrls || m.images?.map(img =>
            img.startsWith('http') ? img : `${API.defaults.baseURL}/uploads/${img}`
          ) || [],
          timestamp: new Date(m.createdAt)
        };
      });

      setChat(formatted);
    } catch (err) {
      console.log("Failed to load history");
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, streamingText]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > MAX_IMAGES) {
      alert("You can upload only 3 images at a time");
      return;
    }
    setImages([...images, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setPreview([...preview, ...previews]);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreview = preview.filter((_, i) => i !== index);
    setImages(newImages);
    setPreview(newPreview);
  };

  const handleSend = async () => {
    if (message.trim() === "" && images.length === 0) {
      alert("Upload image or type a request");
      return;
    }

    // Add user message
    setChat(prev => [...prev, {
      type: "user",
      text: message || "Image upload",
      images: [...preview],
      timestamp: new Date()
    }]);

    setIsStreaming(true);
    setStreamingText("");
    setMessage("");

    const currentPreview = [...preview];
    setImages([]);
    setPreview([]);

    const formData = new FormData();
    images.forEach((img) => formData.append("images", img));
    formData.append("message", message);

    try {
      // ✅ FIX: Get token from localStorage (same as your axios setup)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

      const response = await fetch(`http://localhost:5000/api/recipes/generate-stream`, {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${token}`  // ✅ Proper auth header
        }
      });

      if (!response.ok) throw new Error("Failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data:")) {
            try {
              const data = JSON.parse(line.replace("data: ", ""));
              if (data.chunk) {
                fullText += data.chunk;
                setStreamingText(fullText);  // ✅ Live streaming update
              }
            } catch (e) { }
          }
        }
      }

      // Parse final recipe
      let recipeData = null;
      try {
        recipeData = JSON.parse(fullText);
      } catch (e) { }

      setChat(prev => [...prev, {
        type: "ai",
        recipe: recipeData,
        text: null,
        timestamp: new Date()
      }]);

    } catch (err) {
      setChat(prev => [...prev, {
        type: "ai",
        text: "Failed to generate recipe",
        isError: true,
        timestamp: new Date()
      }]);
    } finally {
      setIsStreaming(false);
      setStreamingText("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const stopStreaming = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setStreamingText("");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col relative overflow-hidden">

      <div className="fixed inset-0 bg-gradient-to-br from-[#f0f9ff] via-[#f8fafc] to-[#f0fdf4] pointer-events-none" />

      {/* Header */}
      <div className="relative bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#b89cff] to-[#7f2dd0] rounded-xl flex items-center justify-center text-white text-xl">
              🍳
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">AI Recipe Assistant</h1>
              <p className="text-xs text-slate-500">Real-time recipe generation</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
            <span className={`w-2 h-2 rounded-full animate-pulse ${isStreaming ? 'bg-[#b89cff]' : 'bg-[#10b981]'}`} />
            {isStreaming ? 'Generating...' : 'Online'}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      {/* Chat Area - Fixed height with scroll */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 relative min-h-0">
        <div className="max-w-4xl mx-auto w-full space-y-6 pb-20">

          {chat.length === 0 && !isStreaming && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gradient-to-br from-[#b89cff]/20 to-[#7f2dd0]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👨‍🍳</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Start Cooking with AI</h3>
              <p className="text-slate-500 max-w-md mx-auto text-sm">
                Upload photos of ingredients or ask for recipe suggestions. Watch as AI creates your recipe in real-time!
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {["Vegetarian dinner ideas", "High protein breakfast", "Quick 15-min meals", "Low calorie desserts"].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setMessage(suggestion)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-600 hover:border-[#b89cff] hover:text-[#b89cff] transition-all shadow-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chat.map((msg, index) => (
            <div key={index} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[90%] md:max-w-[80%] ${msg.type === "user" ? "ml-12" : "mr-12"}`}>
                {msg.type === "ai" && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#b89cff] to-[#7f2dd0] rounded-full flex items-center justify-center text-white text-sm">
                      🤖
                    </div>
                    <span className="text-xs text-slate-500">AI Chef</span>
                  </div>
                )}

                {msg.type === "user" && (
                  <div className="p-4 rounded-2xl shadow-sm bg-gradient-to-r from-[#b89cff] to-[#a78bfa] text-white rounded-br-md">
                    {msg.images && msg.images.length > 0 && (
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {msg.images.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt={`upload-${i}`}
                            className="w-20 h-20 rounded-lg object-cover border-2 border-white/30 shadow-sm"
                          />
                        ))}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <p className="text-xs mt-2 text-white/70">
                      {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}

                {msg.type === "ai" && (
                  <div className={`rounded-2xl shadow-sm ${msg.isError
                    ? "bg-red-50 border border-red-200 text-red-800 rounded-bl-md p-4"
                    : msg.recipe
                      ? "bg-white border border-slate-200 rounded-bl-md overflow-hidden"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-md p-4"
                    }`}>
                    {msg.recipe ? (
                      <RecipeCard recipe={msg.recipe} />
                    ) : (
                      <>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        <p className="text-xs mt-2 text-slate-400">
                          {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Streaming Message */}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="mr-12 max-w-[80%]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#b89cff] to-[#7f2dd0] rounded-full flex items-center justify-center text-white text-sm">
                    🤖
                  </div>
                  <span className="text-xs text-slate-500">AI Chef</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[#b89cff] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-[#b89cff] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-[#b89cff] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-[#b89cff] font-medium">Generating recipe...</span>
                    <button
                      onClick={stopStreaming}
                      className="ml-2 text-xs text-red-500 hover:text-red-600 underline"
                    >
                      Stop
                    </button>
                  </div>
                  {streamingText && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-sm text-slate-600 font-mono whitespace-pre-wrap">
                        {streamingText.length > 500 ? streamingText.slice(0, 500) + "..." : streamingText}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Fixed Input Area at Bottom */}
      <div className={`fixed bottom-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-50 transition-all duration-300 ${open ? 'left-64' : 'left-20'}`}>
        <div className="max-w-4xl mx-auto">
          <div className={`flex items-end gap-3 bg-slate-50 rounded-2xl p-2 border transition-all ${isStreaming
            ? 'border-slate-200 opacity-50'
            : 'border-slate-200 focus-within:border-[#b89cff] focus-within:ring-2 focus-within:ring-[#b89cff]/20'
            }`}>

            <label className={`p-3 rounded-xl transition-colors ${isStreaming ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-white group'}`}>
              <div className="text-xl group-hover:scale-110 transition-transform">📷</div>
              <input
                type="file"
                multiple
                accept="image/*"
                hidden
                disabled={isStreaming}
                onChange={handleImageChange}
              />
            </label>

            <textarea
              placeholder={isStreaming ? "AI is cooking up something..." : "Ask for a recipe, diet plan, or upload food photos..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isStreaming}
              rows={1}
              className="flex-1 bg-transparent px-2 py-3 text-slate-700 placeholder-slate-400 resize-none outline-none max-h-32 disabled:cursor-not-allowed"
              style={{ minHeight: '44px' }}
            />

            {isStreaming ? (
              <button
                onClick={stopStreaming}
                className="p-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={images.length === 0 && message.trim() === ""}
                className="p-3 bg-gradient-to-r from-[#b89cff] to-[#a78bfa] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#b89cff]/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-slate-400">
              {isStreaming ? 'Generating recipe in real-time...' : 'Press Enter to send • Up to 3 images'}
            </p>
            {!isStreaming && (
              <span className={`text-xs px-2 py-1 rounded-full ${images.length > 0 ? 'bg-[#b89cff]/10 text-[#7f2dd0]' : 'text-slate-400'}`}>
                {images.length}/{MAX_IMAGES} images
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Spacer for fixed input */}
      <div className="h-24" />
      {/* Image Preview Bar */}
      {preview.length > 0 && (
        <div className="relative bg-white border-t border-slate-200 px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <span className="text-sm text-slate-500 font-medium">
              Uploading {preview.length} image{preview.length > 1 ? 's' : ''}:
            </span>
            <div className="flex gap-2">
              {preview.map((img, index) => (
                <div key={index} className="relative group">
                  <img src={img} alt={`preview-${index}`} className="w-14 h-14 rounded-lg object-cover border-2 border-slate-200" />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setImages([]); setPreview([]); }}
              className="ml-auto text-xs text-slate-500 hover:text-red-500 transition-colors"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="relative bg-white border-t border-slate-200 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className={`flex items-end gap-3 bg-slate-50 rounded-2xl p-2 border transition-all ${isStreaming
            ? 'border-slate-200 opacity-50'
            : 'border-slate-200 focus-within:border-[#b89cff] focus-within:ring-2 focus-within:ring-[#b89cff]/20'
            }`}>

            <label className={`p-3 rounded-xl transition-colors ${isStreaming ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-white group'}`}>
              <div className="text-xl group-hover:scale-110 transition-transform">📷</div>
              <input
                type="file"
                multiple
                accept="image/*"
                hidden
                disabled={isStreaming}
                onChange={handleImageChange}
              />
            </label>

            <textarea
              placeholder={isStreaming ? "AI is cooking up something..." : "Ask for a recipe, diet plan, or upload food photos..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isStreaming}
              rows={1}
              className="flex-1 bg-transparent px-2 py-3 text-slate-700 placeholder-slate-400 resize-none outline-none max-h-32 disabled:cursor-not-allowed"
              style={{ minHeight: '44px' }}
            />

            {isStreaming ? (
              <button
                onClick={stopStreaming}
                className="p-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={images.length === 0 && message.trim() === ""}
                className="p-3 bg-gradient-to-r from-[#b89cff] to-[#a78bfa] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#b89cff]/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-slate-400">
              {isStreaming ? 'Generating recipe in real-time...' : 'Press Enter to send • Up to 3 images'}
            </p>
            {!isStreaming && (
              <span className={`text-xs px-2 py-1 rounded-full ${images.length > 0 ? 'bg-[#b89cff]/10 text-[#7f2dd0]' : 'text-slate-400'}`}>
                {images.length}/{MAX_IMAGES} images
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Recipe Card Component
function RecipeCard({ recipe }) {
  const [expanded, setExpanded] = useState(false);

  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : typeof recipe.ingredients === 'string'
      ? recipe.ingredients.split(',').map(i => i.trim())
      : [];

  const steps = Array.isArray(recipe.steps)
    ? recipe.steps
    : typeof recipe.steps === 'string'
      ? recipe.steps.split('\n').filter(s => s.trim())
      : [];

  return (
    <div className="bg-white">
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-[#b89cff]/5 to-transparent">
        <h3 className="text-lg font-bold text-slate-800 mb-2">{recipe.recipe_name || "Recipe"}</h3>
        <div className="flex flex-wrap gap-2">
          {recipe.best_time && (
            <span className="px-2 py-1 bg-[#b89cff]/10 text-[#7f2dd0] text-xs rounded-full font-medium">
              🕐 {recipe.best_time}
            </span>
          )}
          {recipe.calories && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
              🔥 {recipe.calories} cal
            </span>
          )}
          {recipe.protein && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
              💪 {recipe.protein} protein
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {ingredients.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 bg-[#b89cff]/10 rounded flex items-center justify-center text-[#b89cff] text-xs">📝</span>
              Ingredients
            </h4>
            <ul className="space-y-1">
              {ingredients.slice(0, expanded ? undefined : 5).map((ingredient, i) => (
                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-[#b89cff] rounded-full mt-2 shrink-0" />
                  <span>{ingredient}</span>
                </li>
              ))}
              {!expanded && ingredients.length > 5 && (
                <li className="text-xs text-[#b89cff] cursor-pointer hover:underline" onClick={() => setExpanded(true)}>
                  +{ingredients.length - 5} more ingredients...
                </li>
              )}
            </ul>
          </div>
        )}

        {steps.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 bg-[#b89cff]/10 rounded flex items-center justify-center text-[#b89cff] text-xs">👨‍🍳</span>
              Instructions
            </h4>
            <ol className="space-y-2">
              {steps.slice(0, expanded ? undefined : 3).map((step, i) => (
                <li key={i} className="text-sm text-slate-600 flex gap-3">
                  <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
              {!expanded && steps.length > 3 && (
                <li className="text-xs text-[#b89cff] cursor-pointer hover:underline pl-8" onClick={() => setExpanded(true)}>
                  +{steps.length - 3} more steps...
                </li>
              )}
            </ol>
          </div>
        )}

        {recipe.reason && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-xs text-slate-600 italic">
              <span className="font-semibold text-[#b89cff]">Why this recipe: </span>
              {recipe.reason}
            </p>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-[#b89cff] font-medium hover:underline"
          >
            {expanded ? "Show less" : "View full recipe"}
          </button>
        </div>
      </div>
    </div>
  );
}