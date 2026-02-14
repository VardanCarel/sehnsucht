import React, { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  onSnapshot,
  serverTimestamp,
  where,
  deleteDoc,
  getDocs,
  limit,
} from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  FileImage as LucideImage,
  X as LucideX,
  Lock as LucideLock,
  Edit as LucideEdit,
  LayoutDashboard as LucideLayoutDashboard,
  LogOut as LucideLogOut,
  Trash2 as LucideTrash2,
  Eye as LucideEye,
  Plus as LucidePlus,
  ArrowUp as LucideArrowUp,
  ArrowDown as LucideArrowDown,
  RotateCcw as LucideRotateCcw,
  RotateCw as LucideRotateCw,
  User as LucideUser,
  Reply as LucideReply,
  Calendar as LucideCalendar,
  FileText as LucideFileText,
  ArrowRight as LucideArrowRight,
  ArrowLeft as LucideArrowLeft,
  AlertCircle as LucideAlertCircle,
  Search as LucideSearch,
  SortAsc as LucideSortAsc,
  SortDesc as LucideSortDesc,
  Send as LucideSend,
  Coffee as LucideCoffee,
  Paperclip as LucidePaperclip,
  ChevronDown as LucideChevronDown,
  ChevronUp as LucideChevronUp,
  Target as LucideTarget,
  Heart as LucideHeart,
} from "lucide-react";

// -----------------------------------------------------------------------------
// 1. CONFIGURATION
// -----------------------------------------------------------------------------

const APP_TITLE = "Sehnsucht";
const WRITER_PASSWORD = "OnlyAliya#24"; // Strictly case-sensitive
const ADMIN_SESSION_KEY = "tmc_admin_session";
const READER_NAME_KEY = "tmc_reader_name";
const GEMINI_KEY_LOCAL = "tmc_gemini_key";

const firebaseConfig = {
  apiKey: "AIzaSyDk05UlR7ewa-xBC6aH4WWexQYH41Gchv0",
  authDomain: "aliya-117ec.firebaseapp.com",
  projectId: "aliya-117ec",
  storageBucket: "aliya-117ec.firebasestorage.app",
  messagingSenderId: "971364626401",
  appId: "1:971364626401:web:33877ae15663da6f416ca0",
  measurementId: "G-08CKR6XVKH",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// -----------------------------------------------------------------------------
// 2. HELPERS
// -----------------------------------------------------------------------------

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

const formatDate = (date) => {
  if (!date) return "...";
  const seconds = date.seconds || Math.floor(new Date(date).getTime() / 1000);
  return new Date(seconds * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const compressImage = (base64Str, maxWidth = 800, quality = 0.6) => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ratio = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(base64Str);
  });
};

// -----------------------------------------------------------------------------
// 3. UI COMPONENTS
// -----------------------------------------------------------------------------

function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className,
  autoFocus,
}) {
  const textareaRef = useRef(null);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [value]);
  return (
    <textarea
      ref={textareaRef}
      value={String(value || "")}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      rows={1}
      autoFocus={autoFocus}
    />
  );
}

function LoginModal({ onClose, onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLogin(password)) {
      onClose();
    } else {
      setError(true);
      setPassword("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(28, 25, 23, 0.8)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="bg-[#FDFBF7] p-8 max-w-sm w-full shadow-2xl border-4 border-stone-900 relative paper-texture">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-900"
        >
          <LucideX size={20} />
        </button>
        <h3 className="font-playfair font-black text-2xl text-stone-900 mb-6 text-center uppercase tracking-widest">
          Editor's Gate
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-500 mb-2">
              Key to the Heart (Case Sensitive)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className="w-full bg-stone-100 border-b-2 border-stone-300 p-2 font-mono text-sm focus:outline-none focus:border-stone-900 transition-colors"
              autoFocus
              placeholder="Enter password..."
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
            {error && (
              <div className="text-red-600 text-[10px] font-mono mt-2 uppercase tracking-widest flex items-center gap-1">
                <LucideAlertCircle size={10} /> Denied
              </div>
            )}
          </div>
          <button className="w-full bg-stone-900 text-white py-3 font-mono text-xs uppercase tracking-[0.2em] hover:bg-red-900 transition-colors shadow-lg active:scale-95">
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminTopBar({ onLogout, onDashboard, view }) {
  return (
    <div className="bg-stone-900 text-white px-6 py-4 flex justify-between items-center text-xs font-mono uppercase tracking-widest sticky top-0 z-[60] border-b border-stone-800 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-6 h-6 bg-red-900 rounded text-white font-bold">
          S
        </div>
        <span className="font-bold text-stone-200">Curator Console</span>
      </div>
      <div className="flex gap-6">
        <button
          onClick={onDashboard}
          className={`hover:text-white transition-colors flex items-center gap-2 ${
            view === "dashboard"
              ? "text-white font-bold border-b-2 border-red-500"
              : "text-stone-400"
          }`}
        >
          <LucideLayoutDashboard size={14} /> Desk
        </button>
        <button
          onClick={onLogout}
          className="text-stone-400 hover:text-red-400 flex items-center gap-2 transition-colors"
        >
          <LucideLogOut size={14} /> Leave
        </button>
      </div>
    </div>
  );
}

function Header({ setView, onLoginClick, isAdmin, view }) {
  return (
    <header className="border-b-4 border-double border-stone-800 mb-8 pb-6 relative mt-4 bg-[#FDFBF7]">
      <div className="flex justify-between items-center border-b border-stone-300 pb-2 mb-4 text-xs font-serif uppercase tracking-widest text-stone-500 px-4">
        <div className="flex gap-4">
          <span>Vol. IV</span>
          <span>Est. 1995</span>
        </div>
        <div className="flex gap-4 items-center">
          <span>A Love Story</span>
          {!isAdmin && (
            <button
              onClick={onLoginClick}
              className="text-stone-300 hover:text-stone-900 transition-colors p-2 -mr-2 cursor-pointer z-50 relative group"
              title="Login"
            >
              <LucideLock
                size={16}
                className="group-hover:scale-110 transition-transform"
              />
            </button>
          )}
        </div>
      </div>
      <div className="text-center relative py-6 group">
        <h1
          onClick={() => setView("home")}
          className="text-5xl md:text-8xl font-black font-playfair uppercase tracking-tighter text-stone-900 cursor-pointer hover:scale-[1.01] transition-transform duration-500 transform scale-y-90 drop-shadow-sm"
        >
          {APP_TITLE}
        </h1>
        <div className="w-full h-px bg-stone-800 my-3"></div>
        <div className="w-full h-[2px] bg-stone-800 mb-3"></div>
        <p className="mt-2 font-cormorant italic text-xl text-stone-700">
          "Longing, captured in ink and light."
        </p>
      </div>
      <div className="mt-6 border-t border-b border-stone-300 py-3 flex justify-center flex-wrap gap-8 font-serif text-sm uppercase tracking-widest bg-[#FDFBF7]">
        <button
          onClick={() => setView("home")}
          className={`hover:text-red-900 transition-colors ${
            view === "home" ? "font-bold text-stone-900" : "text-stone-500"
          }`}
        >
          Latest Chapters
        </button>
        <button
          onClick={() => setView("archive")}
          className={`hover:text-red-900 transition-colors ${
            view === "archive" ? "font-bold text-stone-900" : "text-stone-500"
          }`}
        >
          Archive
        </button>
        {isAdmin && (
          <button
            onClick={() => setView("dashboard")}
            className="text-red-900 font-bold border-b-2 border-red-900"
          >
            Open Desk
          </button>
        )}
      </div>
    </header>
  );
}

function ChapterWheel({ chapters, onSelect }) {
  const wheelChapters = (chapters || []).slice(0, 12);
  const anglePerItem = 360 / (wheelChapters.length || 1);
  const [rotation, setRotation] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const rotate = (direction) => {
    if (wheelChapters.length === 0) return;
    const newIndex =
      direction === "cw"
        ? (selectedIndex + 1) % wheelChapters.length
        : (selectedIndex - 1 + wheelChapters.length) % wheelChapters.length;
    setSelectedIndex(newIndex);
    setRotation(rotation + (direction === "cw" ? -anglePerItem : anglePerItem));
  };

  const currentChapter = wheelChapters[selectedIndex];

  if (wheelChapters.length === 0) return null;

  return (
    <div className="flex flex-col items-center justify-center py-10 bg-[#1c1512] border-y-4 border-stone-800 my-8 overflow-hidden relative shadow-[inset_0_0_60px_rgba(0,0,0,1)]">
      <div className="relative flex flex-col items-center">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30">
          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>
        </div>

        <div className="relative w-48 h-48 md:w-56 md:h-56 mb-6">
          <div
            className="w-full h-full rounded-full border-4 border-stone-800 bg-[#2d241e] shadow-[0_0_40px_rgba(0,0,0,0.8)] relative transition-transform duration-700 cubic-bezier(0.34, 1.56, 0.64, 1)"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-stone-900 border-2 border-stone-700 flex flex-col items-center justify-center z-10 shadow-[inset_0_0_10px_rgba(0,0,0,1)]"
              style={{ transform: `rotate(${-rotation}deg)` }}
            >
              <span className="text-[7px] font-mono text-stone-500 uppercase tracking-widest mb-0.5">
                MEMORY
              </span>
              <span className="text-3xl font-playfair font-black text-red-600 drop-shadow-[0_0_5px_rgba(220,38,38,0.5)]">
                {String(currentChapter?.chapterNumber || "00").padStart(2, "0")}
              </span>
            </div>

            {wheelChapters.map((chapter, i) => (
              <div
                key={chapter.id}
                className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-8 origin-center pt-2"
                style={{ transform: `rotate(${i * anglePerItem}deg)` }}
              >
                <div
                  className={`text-xs font-mono font-bold transition-all duration-300 ${
                    i === selectedIndex
                      ? "text-red-500 scale-110"
                      : "text-stone-600 opacity-30"
                  }`}
                >
                  {String(chapter.chapterNumber || "00").padStart(2, "0")}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center px-4 max-w-sm">
          <div className="flex items-center justify-center gap-2 mb-1">
            <LucideHeart size={10} className="text-red-900 fill-red-900/20" />
            <span className="font-mono text-[9px] uppercase font-black text-stone-400 tracking-[0.2em]">
              A MOMENT FROZEN
            </span>
          </div>
          <h3 className="text-lg md:text-xl font-playfair font-black text-[#eaddcf] mb-4 uppercase tracking-tight line-clamp-1">
            {String(currentChapter?.title || "Searching Memories...")}
          </h3>

          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => rotate("ccw")}
              className="p-2 bg-stone-900 text-stone-500 hover:text-white border border-stone-800 transition-all hover:border-red-900 active:scale-90"
            >
              <LucideRotateCcw size={16} />
            </button>
            <button
              onClick={() => onSelect(currentChapter)}
              className="bg-red-900 text-white px-10 py-2 font-mono text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-red-900 transition-all shadow-xl active:scale-95 border-2 border-transparent"
            >
              Read
            </button>
            <button
              onClick={() => rotate("cw")}
              className="p-2 bg-stone-900 text-stone-500 hover:text-white border border-stone-800 transition-all hover:border-red-900 active:scale-90"
            >
              <LucideRotateCw size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchiveGrid({ chapters, openChapter }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  const filteredChapters = (chapters || [])
    .filter(
      (chapter) =>
        (chapter.title || "")
          .toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (chapter.chapterNumber || "").toString().includes(searchTerm)
    )
    .sort((a, b) => {
      return sortOrder === "desc"
        ? b.chapterNumber - a.chapterNumber
        : a.chapterNumber - b.chapterNumber;
    });

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 animate-fade-in bg-[#f4f1ea] min-h-screen font-mono text-stone-900">
      <div className="border-b-4 border-stone-900 mb-8 pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-black text-stone-900 uppercase tracking-tighter">
            Archive
          </h2>
          <span className="block text-xs uppercase tracking-[0.4em] text-stone-500 mt-2">
            Captured Fragments • Total: {chapters.length}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative group">
            <LucideSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-red-900 transition-colors"
              size={16}
            />
            <input
              type="text"
              placeholder="FIND CHAPTER..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#FDFBF7] border-2 border-stone-300 focus:border-stone-900 focus:outline-none pl-10 pr-4 py-2 text-xs uppercase font-bold tracking-widest w-full sm:w-64 shadow-sm"
            />
          </div>
          <button
            onClick={() =>
              setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
            }
            className="bg-stone-900 text-white px-4 py-2 flex items-center justify-center gap-2 hover:bg-red-900 transition-colors text-[10px] uppercase font-bold tracking-widest shadow-md"
          >
            {sortOrder === "desc" ? (
              <LucideSortDesc size={14} />
            ) : (
              <LucideSortAsc size={14} />
            )}
            {sortOrder === "desc" ? "Newest" : "Oldest"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChapters.map((chapter) => (
          <div
            key={chapter.id}
            onClick={() => openChapter(chapter)}
            className="group cursor-pointer bg-[#f9f7f1] p-4 border border-stone-300 shadow-[2px_2px_0px_rgba(0,0,0,0.1)] hover:shadow-[5px_5px_0px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all relative flex flex-col h-64 paper-texture"
          >
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#333] shadow-inner"></div>
            <div className="flex justify-between items-center border-b border-stone-400/50 pb-2 mt-4">
              <span className="font-bold text-red-900 text-sm">
                NO. {chapter.chapterNumber}
              </span>
              <span className="text-[10px] text-stone-500 uppercase">
                {formatDate(chapter.timestamp)}
              </span>
            </div>
            <div className="flex-1 py-4 flex flex-col justify-center text-center">
              <h3 className="font-playfair font-bold text-xl leading-tight mb-2 line-clamp-3 group-hover:text-red-900 transition-colors">
                {String(chapter.title || "Untitled")}
              </h3>
            </div>
            <div className="border-t border-dashed border-stone-400 pt-2 flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-stone-500">
              <span>Status: Saved</span>
              <span className="group-hover:translate-x-1 transition-transform">
                Read →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommentNode({
  comment,
  allComments,
  level,
  isAdmin,
  onDelete,
  onReply,
  user,
}) {
  const replies = (allComments || []).filter((c) => c.replyTo === comment.id);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [showReplies, setShowReplies] = useState(false);

  const handleReplySubmit = () => {
    if (!replyContent.trim()) return;
    onReply(replyContent, comment.id);
    setReplyContent("");
    setIsReplying(false);
    setShowReplies(true);
  };

  return (
    <div className={`relative ${level > 0 ? "ml-4 md:ml-10 mt-4" : "mt-8"}`}>
      {level > 0 && (
        <div className="absolute -left-4 md:-left-6 top-0 bottom-0 w-px bg-stone-300"></div>
      )}
      <div className="group/comment bg-[#fffdfa] hover:bg-white p-4 border border-stone-300 shadow-sm transition-all hover:shadow-md rounded-sm relative paper-texture">
        {level === 0 && (
          <LucidePaperclip
            className="absolute -top-3 -left-3 text-stone-400 -rotate-45"
            size={18}
          />
        )}
        <div className="flex justify-between items-start mb-2 border-b border-dashed border-stone-200 pb-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                comment.isAdminReply
                  ? "bg-red-900 text-white shadow-sm"
                  : "bg-stone-800 text-white shadow-sm"
              }`}
            >
              {((comment.author || "A")[0] || "").toUpperCase()}
            </div>
            <div>
              <span
                className={`font-bold font-serif block leading-none text-sm ${
                  comment.isAdminReply ? "text-red-900" : "text-stone-900"
                }`}
              >
                {String(comment.author || "Anonymous")}{" "}
                {comment.isAdminReply && (
                  <span className="text-[8px] border border-red-900 px-1 ml-1 rounded">
                    EDITOR
                  </span>
                )}
              </span>
              <span className="text-[9px] font-mono text-stone-400 uppercase tracking-tighter">
                {formatDate(comment.timestamp)}
              </span>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-stone-300 hover:text-red-600 transition-colors opacity-0 group-hover/comment:opacity-100"
            >
              <LucideTrash2 size={14} />
            </button>
          )}
        </div>
        <p className="font-crimson text-stone-800 text-lg leading-relaxed mb-3 pl-1 whitespace-pre-wrap">
          {String(comment.content || "")}
        </p>
        <div className="pl-1 flex items-center gap-4">
          {!isReplying ? (
            <button
              onClick={() => setIsReplying(true)}
              className="text-[10px] uppercase font-black tracking-[0.2em] text-stone-400 hover:text-red-900 transition-colors flex items-center gap-1"
            >
              <LucideReply size={12} /> Reply
            </button>
          ) : (
            <div className="mt-2 w-full animate-fade-in">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 p-2 text-sm font-serif focus:outline-none focus:border-stone-800 transition-colors h-20 resize-none rounded-sm shadow-inner"
                placeholder={`Reply...`}
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setIsReplying(false)}
                  className="text-[10px] uppercase text-stone-400 font-bold hover:text-stone-900 font-mono"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReplySubmit}
                  className="bg-stone-900 text-white text-[10px] px-3 py-1 uppercase font-bold tracking-widest hover:bg-red-900 transition-colors shadow-sm rounded-sm font-mono"
                >
                  Send
                </button>
              </div>
            </div>
          )}
          {replies.length > 0 && !showReplies && (
            <button
              onClick={() => setShowReplies(true)}
              className="text-[10px] uppercase font-black tracking-[0.2em] text-stone-400 hover:text-red-900 flex items-center gap-1"
            >
              View replies ({replies.length})
            </button>
          )}
        </div>
      </div>
      {showReplies && (
        <div className="space-y-2">
          {replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              allComments={allComments}
              level={level + 1}
              isAdmin={isAdmin}
              onDelete={onDelete}
              onReply={onReply}
              user={user}
            />
          ))}
          <button
            onClick={() => setShowReplies(false)}
            className="ml-10 text-[8px] uppercase font-bold text-stone-400 hover:text-stone-900 font-mono"
          >
            Hide thread
          </button>
        </div>
      )}
    </div>
  );
}

function CommentsSection({ chapterId, isAdmin, user }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState(
    localStorage.getItem(READER_NAME_KEY) || ""
  );
  const [isEditingName, setIsEditingName] = useState(
    !localStorage.getItem(READER_NAME_KEY)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(
      query(collection(db, "comments"), where("chapterId", "==", chapterId)),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        data.sort(
          (a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)
        );
        setComments(data);
      }
    );
    return () => unsubscribe();
  }, [chapterId, user]);

  const handleSaveName = async () => {
    const trimmed = authorName.trim();
    if (!trimmed) return;
    setNameError("");
    if (trimmed.toLowerCase() === "the editor") {
      setNameError("IDENTITY RESERVED.");
      return;
    }
    const q = query(
      collection(db, "comments"),
      where("author", "==", trimmed),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty && snapshot.docs[0].data().uid !== user.uid) {
      setNameError("Taken by another reader.");
      return;
    }
    localStorage.setItem(READER_NAME_KEY, trimmed);
    setIsEditingName(false);
  };

  const handleCommentSubmit = async (content, replyTo = null) => {
    if (!user || !content.trim()) return;
    if (!isAdmin && !authorName) {
      setIsEditingName(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "comments"), {
        chapterId,
        content: String(content),
        author: String(isAdmin ? "The Curator" : authorName),
        isAdminReply: isAdmin,
        replyTo: replyTo,
        uid: user.uid,
        timestamp: serverTimestamp(),
      });
      setNewComment("");
    } catch (err) {
      alert(`Failed to post.`);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="mt-24 pt-12 border-t border-stone-300 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-mono uppercase text-xs font-black tracking-[0.4em] text-stone-400">
          Comments
        </h3>
        {!isAdmin && (
          <div className="text-[10px] font-mono uppercase font-bold text-stone-500 text-right">
            {isEditingName ? (
              <div className="flex flex-col items-end">
                <div className="flex border-b border-stone-800">
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="ENTER NAME..."
                    className="bg-transparent focus:outline-none p-1 text-stone-900 w-32"
                  />
                  <button
                    onClick={handleSaveName}
                    className="text-red-900 hover:text-black font-mono"
                  >
                    SAVE
                  </button>
                </div>
                {nameError && (
                  <div className="text-red-600 mt-1 text-[8px] font-mono">
                    {nameError}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                RECOGNIZED AS:{" "}
                <span className="text-stone-900 border-b border-stone-900">
                  {String(authorName)}
                </span>
                <button onClick={() => setIsEditingName(true)}>
                  <LucideEdit size={12} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mb-12 bg-white/50 p-4 border-2 border-stone-300 shadow-inner rounded-sm relative paper-texture">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="w-full p-2 bg-transparent focus:outline-none font-serif text-xl placeholder-stone-400 border-b border-stone-200 transition-colors focus:border-stone-800"
          placeholder="Write your comment..."
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={() => handleCommentSubmit(newComment)}
            disabled={isSubmitting || (!isAdmin && !authorName)}
            className="bg-stone-900 text-white px-6 py-2 font-mono text-xs uppercase tracking-[0.3em] hover:bg-red-900 transition-colors shadow-lg active:scale-95 flex items-center gap-2"
          >
            {isSubmitting ? (
              <LucideLoader className="animate-spin" size={14} />
            ) : (
              <LucideSend size={14} />
            )}{" "}
            Post
          </button>
        </div>
      </div>
      <div className="space-y-4 pb-20">
        {(comments || [])
          .filter((c) => !c.replyTo)
          .map((comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              allComments={comments}
              level={0}
              isAdmin={isAdmin}
              onDelete={(id) => deleteDoc(doc(db, "comments", id))}
              onReply={handleCommentSubmit}
              user={user}
            />
          ))}
      </div>
    </div>
  );
}

function FullReader({
  chapter,
  allChapters,
  onBack,
  isAdmin,
  onEdit,
  onChangeChapter,
  user,
}) {
  if (!chapter) return null;
  const currentIndex = allChapters.findIndex((c) => c.id === chapter.id);
  const next = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const prev =
    currentIndex < allChapters.length - 1
      ? allChapters[currentIndex + 1]
      : null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#2d241e] overflow-y-auto custom-scrollbar"
      style={{ position: "fixed", inset: 0, zIndex: 100, overflowY: "auto" }}
    >
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url('https://www.transparenttextures.com/patterns/dark-wood.png')`,
        }}
      ></div>
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <filter id="paper-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.6"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
          <feBlend mode="multiply" in="SourceGraphic" />
        </filter>
      </svg>
      <div className="sticky top-0 z-[110] w-full bg-[#1c1917] text-[#eaddcf] border-b border-stone-700 px-6 py-4 flex justify-between items-center shadow-xl">
        <button
          onClick={onBack}
          className="flex items-center gap-2 hover:text-red-500 font-mono text-[10px] uppercase tracking-[0.3em] transition-all group"
        >
          <LucideArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />{" "}
          Back to List
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-mono opacity-50 uppercase tracking-widest">
            Story
          </span>
          <span className="font-playfair italic font-bold text-sm text-stone-300">
            A Fragile Memory
          </span>
        </div>
        {isAdmin ? (
          <button
            onClick={() => onEdit(chapter)}
            className="bg-red-900/20 text-red-500 border border-red-900/50 px-3 py-1 text-[10px] font-mono uppercase hover:bg-red-900 hover:text-white transition-colors"
          >
            Edit Chapter
          </button>
        ) : (
          <div className="w-24"></div>
        )}
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto my-8 md:my-16 px-4 md:px-0">
        <div className="bg-[#FDFBF7] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden paper-texture-container min-h-screen">
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] grain-overlay"></div>

          <div className="absolute top-0 left-0 bottom-0 w-8 border-r border-stone-200 bg-stone-100/30 flex flex-col justify-around py-20 px-2 opacity-50">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full bg-stone-300 shadow-inner border border-stone-400"
              ></div>
            ))}
          </div>
          <div className="p-12 md:p-24 relative z-10">
            <div className="text-center mb-20 border-b border-stone-200 pb-12">
              <div className="flex items-center justify-center gap-3 mb-8">
                <span className="w-10 h-px bg-stone-300"></span>
                <span className="font-mono text-xs uppercase tracking-[0.5em] text-red-900 font-bold">
                  Chapter {String(chapter.chapterNumber)}
                </span>
                <span className="w-10 h-px bg-stone-300"></span>
              </div>
              <h1 className="text-5xl md:text-7xl font-playfair font-black text-stone-900 mb-8 leading-[1] capitalize tracking-tighter drop-shadow-sm">
                {String(chapter.title || "Untitled")}
              </h1>
              <div className="flex justify-center items-center gap-8 font-mono text-[9px] uppercase tracking-widest text-stone-400">
                <div className="flex items-center gap-2">
                  <LucideCalendar size={12} /> {formatDate(chapter.timestamp)}
                </div>
                <div className="flex items-center gap-2">
                  <LucideUser size={12} /> Soul ID:{" "}
                  {String(chapter.id || "").slice(0, 8)}
                </div>
              </div>
            </div>
            <div className="prose prose-stone prose-xl max-w-none text-justify leading-[2] text-stone-900 font-crimson selection:bg-red-900/10">
              {Array.isArray(chapter.blocks) ? (
                chapter.blocks.map((block, idx) => {
                  if (block.type === "text")
                    return (
                      <div
                        key={idx}
                        className={`mb-12 whitespace-pre-wrap ${
                          idx === 0 ? "drop-cap" : ""
                        }`}
                      >
                        {String(block.content || "")}
                      </div>
                    );
                  if (block.type === "image")
                    return (
                      <div
                        key={idx}
                        className="my-16 flex flex-col items-center"
                      >
                        <div className="p-2 bg-white border border-stone-300 shadow-xl rotate-1 hover:rotate-0 transition-transform duration-700 max-w-xl">
                          <img
                            src={block.url}
                            alt="Chapter Fragment"
                            className={`w-full h-auto brightness-95 contrast-110 ${
                              block.style === "sepia"
                                ? "sepia grayscale-[0.2]"
                                : "grayscale"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  return null;
                })
              ) : (
                <p className="whitespace-pre-wrap">
                  {String(chapter.content || "")}
                </p>
              )}
            </div>
            <div className="mt-32 pt-20 border-t-2 border-stone-200">
              <div className="flex justify-between items-center gap-12">
                {prev ? (
                  <button
                    onClick={() => onChangeChapter(prev)}
                    className="group flex-1 text-left p-6 hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-100 rounded-sm"
                  >
                    <span className="block text-[8px] font-mono uppercase text-stone-400 mb-2 font-black tracking-[0.3em]">
                      Earlier
                    </span>
                    <span className="block text-xl font-bold font-serif leading-tight text-stone-800 transition-transform group-hover:-translate-x-2">
                      ← {prev.title}
                    </span>
                  </button>
                ) : (
                  <div className="flex-1"></div>
                )}
                <div className="flex flex-col items-center gap-2 opacity-20">
                  <LucideCoffee size={24} />
                  <div className="w-1 h-20 bg-stone-300"></div>
                </div>
                {next ? (
                  <button
                    onClick={() => onChangeChapter(next)}
                    className="group flex-1 text-right p-6 hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-100 rounded-sm"
                  >
                    <span className="block text-[8px] font-mono uppercase text-stone-400 mb-2 font-black tracking-[0.3em]">
                      Next
                    </span>
                    <span className="block text-xl font-bold font-serif leading-tight text-stone-800 transition-transform group-hover:translate-x-2">
                      {next.title} →
                    </span>
                  </button>
                ) : (
                  <div className="flex-1"></div>
                )}
              </div>
              <CommentsSection
                chapterId={chapter.id}
                isAdmin={isAdmin}
                user={user}
              />
              <div className="text-center py-12">
                <span className="font-mono text-[10px] uppercase text-stone-300 tracking-[1em]">
                  *** END ***
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`.paper-texture-container { background-image: url("https://www.transparenttextures.com/patterns/cardboard.png"); } .grain-overlay { filter: url(#paper-grain); } .paper-texture { background-image: url("https://www.transparenttextures.com/patterns/cardboard.png"); } .drop-cap:first-letter { float: left; font-family: 'Playfair Display', serif; font-size: 6rem; line-height: 0.8; padding-top: 10px; padding-right: 12px; color: #1c1917; font-weight: 900; text-shadow: 2px 2px 0px rgba(127, 29, 29, 0.2); }`}</style>
    </div>
  );
}

function HeroArticle({ chapter, onClick, isAdmin, onEdit }) {
  return (
    <article
      onClick={() => onClick(chapter)}
      className="cursor-pointer group relative mb-24 animate-fade-in mx-4 md:mx-0"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border-4 border-stone-900 shadow-[8px_8px_0_0_rgba(28,25,23,0.15)] bg-white transition-transform hover:-translate-y-1">
        <div className="col-span-7 p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-900 relative overflow-hidden h-[300px]">
          <div className="absolute -right-2 -bottom-6 text-[10rem] font-black text-stone-100 font-playfair select-none pointer-events-none opacity-60 z-0 leading-none">
            {String(chapter.chapterNumber)}
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 font-mono text-[10px] uppercase tracking-widest text-red-900 font-bold border-b border-red-900 pb-1 w-fit">
              Latest • {formatDate(chapter.timestamp)}
            </div>
            <h2 className="text-3xl md:text-5xl font-black font-playfair text-stone-900 mb-4 leading-[0.9] group-hover:text-stone-700 transition-colors line-clamp-2">
              {String(chapter.title || "Untitled")}
            </h2>
            <p className="font-crimson text-lg text-stone-600 leading-relaxed line-clamp-3 mb-6">
              {String(chapter.content || "").slice(0, 180)}...
            </p>
          </div>
          <div className="relative z-10 pt-4">
            <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-900 group-hover:gap-3 transition-all font-mono">
              Read <LucideArrowRight size={14} />
            </button>
          </div>
        </div>
        <div className="col-span-5 relative bg-stone-200 flex items-center justify-center p-6 overflow-hidden h-[300px]">
          {chapter.imageUrl ? (
            <img
              src={chapter.imageUrl}
              alt="Cover"
              className={`w-full h-full object-cover border-4 border-white ${
                chapter.imageStyle === "sepia"
                  ? "sepia contrast-110"
                  : "grayscale contrast-125"
              }`}
            />
          ) : (
            <LucideFileText size={48} className="text-stone-400" />
          )}
        </div>
      </div>
      {isAdmin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(chapter);
          }}
          className="absolute top-2 right-2 z-30 bg-white border border-stone-900 text-stone-900 p-1.5 hover:bg-stone-900 hover:text-white transition-colors shadow-sm"
        >
          <LucideEdit size={14} />
        </button>
      )}
    </article>
  );
}

function ArticleCard({ chapter, onClick, isAdmin, onEdit }) {
  return (
    <article
      onClick={() => onClick(chapter)}
      className="cursor-pointer group relative border-b border-dashed border-stone-300 pb-4 mb-6 last:border-0"
    >
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[9px] font-mono uppercase text-stone-500 tracking-wider">
          {formatDate(chapter.timestamp)}
        </span>
        <span className="text-[9px] font-mono uppercase text-stone-900 font-bold bg-stone-200 px-1">
          #{String(chapter.chapterNumber)}
        </span>
      </div>
      <h3 className="text-lg font-playfair font-bold leading-tight mb-1 group-hover:text-red-900 transition-colors">
        {String(chapter.title || "Untitled")}
      </h3>
      {isAdmin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(chapter);
          }}
          className="absolute top-0 right-0 text-stone-300 hover:text-blue-600"
        >
          <LucideEdit size={12} />
        </button>
      )}
    </article>
  );
}

function AdminDashboardView({
  chapters,
  onCreateNew,
  onEdit,
  onViewChapter,
  user,
}) {
  const [activeTab, setActiveTab] = useState("manuscripts");
  const [comments, setComments] = useState([]);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(
      query(collection(db, "comments")),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        data.sort(
          (a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)
        );
        setComments(data);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const handleEditorReply = async () => {
    if (!replyContent.trim() || !replyTarget) return;
    setIsSending(true);
    try {
      await addDoc(collection(db, "comments"), {
        chapterId: replyTarget.chapterId,
        content: String(replyContent),
        author: "The Curator",
        isAdminReply: true,
        replyTo: replyTarget.id,
        uid: user.uid,
        timestamp: serverTimestamp(),
      });
      setReplyContent("");
      setReplyTarget(null);
    } catch (err) {
      alert("Reply failed.");
    }
    setIsSending(false);
  };

  const getChapterTitle = (id) => {
    const ch = (chapters || []).find((c) => c.id === id);
    return ch ? String(ch.title) : "Unknown File";
  };

  const getThreadHistory = (commentId) => {
    return (comments || []).filter((c) => c.replyTo === commentId);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 animate-fade-in min-h-screen bg-[#FDFBF7]">
      <div className="flex justify-between items-center mb-8 border-b-4 border-stone-900 pb-4">
        <h2 className="text-4xl font-playfair font-black text-stone-900 uppercase">
          Editor's Desk
        </h2>
        <button
          onClick={onCreateNew}
          className="bg-stone-900 text-white px-6 py-2 font-mono text-sm uppercase tracking-widest hover:bg-red-900 transition-all shadow-md"
        >
          + New Draft
        </button>
      </div>
      <div className="flex gap-8 border-b border-stone-300 mb-8 font-mono text-sm uppercase tracking-widest">
        <button
          onClick={() => setActiveTab("manuscripts")}
          className={`pb-2 transition-all ${
            activeTab === "manuscripts"
              ? "border-b-2 border-red-900 text-red-900 font-bold"
              : "text-stone-400 hover:text-stone-800"
          }`}
        >
          Chapters ({chapters.length})
        </button>
        <button
          onClick={() => setActiveTab("inbox")}
          className={`pb-2 transition-all ${
            activeTab === "inbox"
              ? "border-b-2 border-red-900 text-red-900 font-bold"
              : "text-stone-400 hover:text-stone-800"
          }`}
        >
          Inbox ({comments.filter((c) => !c.isAdminReply).length})
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === "manuscripts" ? (
          chapters.map((chapter) => (
            <div
              key={chapter.id}
              className="bg-white border border-stone-300 p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-all group rounded-sm"
            >
              <div>
                <div className="text-xs font-mono text-stone-500 uppercase mb-1">
                  {formatDate(chapter.timestamp)} • Ch{" "}
                  {String(chapter.chapterNumber)}
                </div>
                <h4 className="font-playfair font-bold text-lg group-hover:text-red-900">
                  {String(chapter.title || "Untitled")}
                </h4>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onViewChapter(chapter)}
                  className="p-2 text-stone-400 hover:text-stone-900"
                >
                  <LucideEye size={18} />
                </button>
                <button
                  onClick={() => onEdit(chapter)}
                  className="p-2 text-stone-400 hover:text-blue-600"
                >
                  <LucideEdit size={18} />
                </button>
                <button
                  onClick={() => deleteDoc(doc(db, "chapters", chapter.id))}
                  className="p-2 text-stone-400 hover:text-red-600"
                >
                  <LucideTrash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {comments.filter((c) => !c.isAdminReply).length === 0 ? (
              <div className="py-20 text-center text-stone-400 font-mono text-xs uppercase tracking-widest border-2 border-dashed border-stone-200">
                Empty.
              </div>
            ) : (
              comments
                .filter((c) => !c.isAdminReply)
                .map((comment) => {
                  const history = getThreadHistory(comment.id);
                  return (
                    <div
                      key={comment.id}
                      className="bg-[#fffdfa] border border-stone-300 shadow-sm relative group rounded-sm overflow-hidden"
                    >
                      <div className="bg-stone-50 px-4 py-2 border-b border-stone-200 flex justify-between items-center">
                        <div className="text-[10px] font-mono text-red-900 uppercase font-black tracking-widest">
                          CHAPTER: {getChapterTitle(comment.chapterId)}
                        </div>
                        <div className="flex gap-4">
                          <button
                            onClick={() =>
                              setReplyTarget(
                                replyTarget?.id === comment.id ? null : comment
                              )
                            }
                            className="text-stone-400 hover:text-red-900 flex items-center gap-1 text-[10px] font-bold uppercase font-mono"
                          >
                            <LucideReply size={12} /> Respond
                          </button>
                          <button
                            onClick={() =>
                              deleteDoc(doc(db, "comments", comment.id))
                            }
                            className="text-stone-300 hover:text-red-600"
                          >
                            <LucideTrash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-stone-900 font-serif text-sm">
                            {String(comment.author)}
                          </span>
                          <span className="text-[9px] font-mono text-stone-400 uppercase tracking-tighter">
                            {formatDate(comment.timestamp)}
                          </span>
                        </div>
                        <p className="font-crimson text-stone-800 leading-relaxed italic">
                          "{String(comment.content || "")}"
                        </p>
                        {history.length > 0 && (
                          <div className="mt-4 border-t border-stone-100 pt-3 space-y-3">
                            <div className="text-[8px] font-black uppercase text-stone-300 tracking-[0.2em] font-mono mb-1">
                              YOUR REPLIES
                            </div>
                            {history.map((hist) => (
                              <div
                                key={hist.id}
                                className="flex gap-2 items-start pl-2 border-l-2 border-red-900/40 bg-stone-50 p-2"
                              >
                                <span className="text-[10px] font-bold text-red-900 font-serif whitespace-nowrap">
                                  You:
                                </span>
                                <p className="text-[11px] font-serif text-stone-700 leading-tight">
                                  {String(hist.content)}
                                </p>
                                <span className="text-[7px] font-mono text-stone-300 uppercase ml-auto">
                                  {formatDate(hist.timestamp)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {replyTarget?.id === comment.id && (
                        <div className="p-4 bg-stone-100 border-t border-stone-200 animate-fade-in">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="w-full p-3 bg-white border-2 border-stone-300 focus:border-red-900 focus:outline-none font-serif text-sm h-24 resize-none rounded-sm shadow-inner"
                            placeholder={`Reply...`}
                            autoFocus
                          />
                          <div className="flex justify-end gap-3 mt-3">
                            <button
                              onClick={() => setReplyTarget(null)}
                              className="text-[10px] uppercase font-bold text-stone-400 hover:text-stone-900 font-mono"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleEditorReply}
                              disabled={isSending || !replyContent.trim()}
                              className="bg-red-900 text-white px-4 py-1.5 font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-black disabled:opacity-50 flex items-center gap-2 rounded-sm shadow-md"
                            >
                              {isSending ? "SENDING..." : "SEND REPLY"}{" "}
                              <LucideSend size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function WriterEditor({ user, onClose, onSave, initialData }) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [chapterNum, setChapterNum] = useState(
    initialData?.chapterNumber || ""
  );
  const [blocks, setBlocks] = useState(
    initialData?.blocks || [{ id: generateId(), type: "text", content: "" }]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showImageGen, setShowImageGen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageStyle, setImageStyle] = useState("noir");
  const [customKey, setCustomKey] = useState(
    localStorage.getItem(GEMINI_KEY_LOCAL) || ""
  );

  const handleGenerateImage = async () => {
    if (!imagePrompt) return;
    setIsGenerating(true);
    try {
      const apiKey = customKey || "";
      const enhancedPrompt = `${imagePrompt}, ${
        imageStyle === "sepia"
          ? "sepia vintage film noir"
          : "high contrast black and white"
      }, visual art, photographic style, strict instructions: NO text, NO letters, NO words, NO signatures, NO watermarks, NO calligraphy, clean visual composition.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instances: [{ prompt: enhancedPrompt }],
            parameters: { sampleCount: 1 },
          }),
        }
      );
      const data = await response.json();
      if (data.predictions?.[0]) {
        const compressed = await compressImage(
          `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`
        );
        setBlocks([
          ...blocks,
          {
            id: generateId(),
            type: "image",
            url: compressed,
            style: imageStyle,
          },
        ]);
        setShowImageGen(false);
        setImagePrompt("");
      }
    } catch (error) {
      alert(`Generation failed.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!title || !chapterNum) return;
    setIsSaving(true);
    try {
      const firstText = blocks.find((b) => b.type === "text")?.content || "";
      const firstImage = blocks.find((b) => b.type === "image")?.url || null;
      const firstImageStyle =
        blocks.find((b) => b.type === "image")?.style || "noir";
      const dataPayload = {
        title: String(title),
        chapterNumber: parseInt(chapterNum),
        blocks,
        content: String(firstText),
        imageUrl: firstImage,
        imageStyle: firstImageStyle,
        authorId: user.uid,
        lastEdited: serverTimestamp(),
      };
      const collectionRef = collection(db, "chapters");
      if (!initialData) {
        dataPayload.timestamp = serverTimestamp();
        await addDoc(collectionRef, dataPayload);
      } else {
        await updateDoc(doc(db, "chapters", initialData.id), dataPayload);
      }
      onSave();
      onClose();
    } catch (e) {
      alert(`Failed to publish.`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[#FDFBF7] z-[100] flex flex-col animate-fade-in overflow-hidden"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#FDFBF7",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="flex justify-between items-center px-6 py-4 border-b border-stone-200 bg-white">
        <button onClick={onClose} className="p-2">
          <LucideX size={24} />
        </button>
        <div className="flex gap-4">
          <button
            onClick={() => setShowImageGen(true)}
            className="px-4 py-2 text-stone-500 font-mono text-xs uppercase hover:text-stone-900 flex items-center gap-2 border border-stone-300 rounded-sm"
          >
            <LucideImage size={14} /> Develop Memory
          </button>
          <button
            onClick={handlePublish}
            disabled={isSaving}
            className="bg-stone-900 text-white px-8 py-2 font-mono text-xs uppercase tracking-widest hover:bg-red-900 transition-all rounded-sm shadow-md"
          >
            {isSaving ? "Saving..." : "Seal Memoir"}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <input
              type="number"
              value={chapterNum}
              onChange={(e) => setChapterNum(e.target.value)}
              placeholder="Entry #"
              className="font-mono text-stone-900 bg-transparent text-sm w-20 border-b border-stone-300 mr-4"
            />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title..."
              className="w-full text-5xl font-playfair font-black text-stone-900 placeholder-stone-200 bg-transparent focus:outline-none"
            />
          </div>
          <div className="space-y-8">
            {blocks.map((block, index) => (
              <div key={block.id} className="relative group">
                <div className="absolute -left-12 top-0 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      const b = [...blocks];
                      if (index > 0) {
                        [b[index], b[index - 1]] = [b[index - 1], b[index]];
                        setBlocks(b);
                      }
                    }}
                  >
                    <LucideArrowUp size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setBlocks(blocks.filter((b) => b.id !== block.id))
                    }
                  >
                    <LucideTrash2 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      const b = [...blocks];
                      if (index < b.length - 1) {
                        [b[index], b[index + 1]] = [b[index + 1], b[index]];
                        setBlocks(b);
                      }
                    }}
                  >
                    <LucideArrowDown size={16} />
                  </button>
                </div>
                {block.type === "text" ? (
                  <AutoResizeTextarea
                    value={block.content}
                    onChange={(e) =>
                      setBlocks(
                        blocks.map((b) =>
                          b.id === block.id
                            ? { ...b, content: e.target.value }
                            : b
                        )
                      )
                    }
                    className="w-full bg-transparent font-crimson text-xl leading-relaxed focus:outline-none placeholder-stone-200"
                    placeholder="Chronicle the longing..."
                  />
                ) : (
                  <div className="p-2 border bg-white shadow-md">
                    <img
                      src={block.url}
                      className={`w-full ${
                        block.style === "sepia" ? "sepia" : "grayscale"
                      }`}
                      alt="A Fragment Captured"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-12 flex justify-center gap-6">
            <button
              onClick={() =>
                setBlocks([
                  ...blocks,
                  { id: generateId(), type: "text", content: "" },
                ])
              }
              className="p-3 border-2 border-stone-800 rounded-full hover:bg-stone-800 hover:text-white transition-all font-mono"
            >
              <LucidePlus size={20} />
            </button>
          </div>
        </div>
      </div>

      {showImageGen && (
        <div
          className="fixed inset-0 bg-stone-900/50 flex items-center justify-center p-4 z-[110] backdrop-blur-sm"
          style={{ backgroundColor: "rgba(28, 25, 23, 0.7)" }}
        >
          <div className="bg-[#FDFBF7] p-8 max-w-lg w-full shadow-2xl rounded-sm border-4 border-stone-900 relative paper-texture">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-mono text-xs font-black uppercase tracking-widest text-stone-500">
                DEVELOP VISUAL MEMORY
              </h4>
              <button onClick={() => setShowImageGen(false)}>
                <LucideX size={18} />
              </button>
            </div>
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setImageStyle("noir")}
                className={`flex-1 py-3 text-[10px] font-bold uppercase border-2 transition-all ${
                  imageStyle === "noir"
                    ? "bg-stone-900 text-white border-stone-900"
                    : "border-stone-300"
                }`}
              >
                Noir Echo
              </button>
              <button
                onClick={() => setImageStyle("sepia")}
                className={`flex-1 py-3 text-[10px] font-bold uppercase border-2 transition-all ${
                  imageStyle === "sepia"
                    ? "bg-[#704214] text-white border-[#704214]"
                    : "border-stone-300"
                }`}
              >
                Aged Sepia
              </button>
            </div>
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              className="w-full border-2 border-stone-300 p-4 font-mono text-sm h-32 mb-6 focus:border-stone-900 focus:outline-none transition-colors"
              placeholder="Describe the memory in detail..."
            />
            <button
              onClick={handleGenerateImage}
              disabled={isGenerating}
              className="w-full bg-stone-900 text-white py-4 font-mono text-xs font-black uppercase tracking-[0.2em] hover:bg-red-900 transition-colors shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <span className="animate-pulse font-mono">
                  DEVELOPING MEMORY...
                </span>
              ) : (
                "FREEZE MOMENT"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 4. MAIN APP COMPONENT
// -----------------------------------------------------------------------------

export default function App() {
  const [view, setView] = useState("home");
  const [chapters, setChapters] = useState([]);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [editingChapter, setEditingChapter] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    // Persistent Session Tracking
    const storedAdmin = localStorage.getItem(ADMIN_SESSION_KEY);
    if (storedAdmin === "true") setIsAdmin(true);

    const initAuth = async () => {
      try {
        if (!auth.currentUser) await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth failed:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(
      query(collection(db, "chapters")),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        data.sort(
          (a, b) =>
            (Number(b.chapterNumber) || 0) - (Number(a.chapterNumber) || 0)
        );
        setChapters(data);
      }
    );
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!document.querySelector('script[src="https://cdn.tailwindcss.com"]')) {
      const script = document.createElement("script");
      script.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(script);
    }
  }, []);

  const openChapter = (chapter) => {
    setSelectedChapter(chapter);
    setView("reader");
    window.scrollTo(0, 0);
  };

  const handleLoginSubmit = (password) => {
    if (password === WRITER_PASSWORD) {
      setIsAdmin(true);
      localStorage.setItem(ADMIN_SESSION_KEY, "true");
      setView("dashboard");
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setView("home");
  };

  return (
    <div
      className="min-h-screen bg-[#FDFBF7] text-stone-900 font-serif selection:bg-red-900 selection:text-white pb-20"
      style={{ minHeight: "100vh", backgroundColor: "#FDFBF7" }}
    >
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLoginSubmit}
        />
      )}

      {view === "reader" && selectedChapter && (
        <FullReader
          chapter={selectedChapter}
          allChapters={chapters}
          onBack={() => setView("home")}
          isAdmin={isAdmin}
          onEdit={(c) => {
            setEditingChapter(c);
            setView("editor");
          }}
          onChangeChapter={setSelectedChapter}
          user={user}
        />
      )}

      {view === "editor" && (
        <WriterEditor
          user={user}
          onClose={() => setView(isAdmin ? "dashboard" : "home")}
          onSave={() => setView(isAdmin ? "dashboard" : "home")}
          initialData={editingChapter}
        />
      )}

      {view === "dashboard" && isAdmin && (
        <>
          <AdminTopBar
            onLogout={handleLogout}
            onDashboard={() => setView("dashboard")}
            view={view}
          />
          <AdminDashboardView
            chapters={chapters}
            onCreateNew={() => {
              setEditingChapter(null);
              setView("editor");
            }}
            onEdit={(c) => {
              setEditingChapter(c);
              setView("editor");
            }}
            onViewChapter={(c) => {
              setSelectedChapter(c);
              setView("reader");
            }}
            user={user}
          />
        </>
      )}

      {(view === "home" || view === "archive") && (
        <>
          {isAdmin && (
            <AdminTopBar
              onLogout={handleLogout}
              onDashboard={() => setView("dashboard")}
              view={view}
            />
          )}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Header
              setView={setView}
              onLoginClick={() =>
                isAdmin ? setView("dashboard") : setShowLoginModal(true)
              }
              isAdmin={isAdmin}
              view={view}
            />
            {view === "home" && (
              <div className="animate-fade-in">
                <ChapterWheel chapters={chapters} onSelect={openChapter} />
                {chapters.length > 0 && (
                  <HeroArticle
                    chapter={chapters[0]}
                    onClick={openChapter}
                    isAdmin={isAdmin}
                    onEdit={(c) => {
                      setEditingChapter(c);
                      setView("editor");
                    }}
                  />
                )}
                <div className="max-w-4xl mx-auto mt-12 mb-24">
                  <h3 className="font-mono text-sm uppercase tracking-widest text-stone-500 mb-6 border-b border-stone-300 pb-2">
                    Recent List
                  </h3>
                  {chapters.slice(1, 6).map((chapter) => (
                    <ArticleCard
                      key={chapter.id}
                      chapter={chapter}
                      onClick={openChapter}
                      isAdmin={isAdmin}
                      onEdit={(c) => {
                        setEditingChapter(c);
                        setView("editor");
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            {view === "archive" && (
              <ArchiveGrid chapters={chapters} openChapter={openChapter} />
            )}
          </div>
        </>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;700&display=swap');
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-cormorant { font-family: 'Cormorant Garamond', serif; }
        .font-crimson { font-family: 'Crimson Text', serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #d6d3d1; border-radius: 20px; }
        .paper-texture { background-image: url("https://www.transparenttextures.com/patterns/cardboard.png"); }
      `}</style>
    </div>
  );
}
