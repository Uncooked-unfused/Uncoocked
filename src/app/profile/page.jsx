"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import {
  User,
  Mail,
  Shield,
  Terminal,
  Briefcase,
  Users,
  FileText,
  CheckCircle,
  Activity,
  ArrowRight,
  Save,
  Edit2,
  X,
  Info,
  Trophy,
} from "lucide-react";

const SUGGESTED_CATEGORIES = [
  "Technology", "Startups", "AI & Machine Learning", "Programming", 
  "Gaming & Esports", "Music", "Business", "Finance", "Education", 
  "Workshops", "Networking", "Sports", "Art & Design", "Photography", 
  "Health & Fitness", "Food & Drinks", "Entertainment", "Cultural Events", 
  "Career & Jobs", "Community Events"
];

export default function ProfilePage() {
  const { user } = useUser();
  // Profile form state
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [github, setGithub] = useState("");
  const [track, setTrack] = useState("Computer Science & Tech");
  const [team, setTeam] = useState("");
  const [dob, setDob] = useState("");
  // UI States
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [attendingCount, setAttendingCount] = useState(0);
  const [hostedCount, setHostedCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);

  // 1. Calculate XP
  const xp = (attendingCount * 10) + (hostedCount * 50);

  // 2. Determine Rank & Progress
  const getRankDetails = (currentXp) => {
    if (currentXp < 50) return { name: "Freshman", icon: "🥉", color: "text-amber-600", bg: "bg-amber-600/10", border: "border-amber-600/30", next: 50 };
    if (currentXp < 100) return { name: "Sophomore", icon: "🥈", color: "text-zinc-300", bg: "bg-zinc-400/10", border: "border-zinc-400/30", next: 100 };
    if (currentXp < 250) return { name: "Junior", icon: "🥇", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", next: 250 };
    if (currentXp < 500) return { name: "Senior", icon: "🌟", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/30", next: 500 };
    return { name: "Campus Legend", icon: "👑", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", next: null };
  };

  const rank = getRankDetails(xp);
  
  let progressPercentage = 100;
  if (rank.next) {
    progressPercentage = Math.min(100, Math.max(0, (xp / rank.next) * 100));
  }

  useEffect(() => {
    let isMounted = true;
    const fetchProfileData = async () => {
      try {
        if (!user) {
          if (isMounted) setLoading(false);
          return;
        }

        // Fetch profile data
        const profileRes = await fetch(`/api/users/profile?email=${encodeURIComponent(user)}`, { cache: "no-store" });
        const profileData = await profileRes.json();
        
        if (profileData.success && profileData.user) {
          const dbUser = profileData.user;
          if (isMounted) {
            setFullName(dbUser.fullName || dbUser.name || (typeof user === "string" ? user.split("@")[0] : ""));
            setBio(dbUser.bio || "");
            setGithub(dbUser.portfolioUrl || dbUser.github || "");
            setTrack(dbUser.department || dbUser.track || "Computer Science & Tech");
            setTeam(dbUser.team || "");
            if (dbUser.dob) setDob(dbUser.dob);

            if (dbUser.interests) {
              try {
                const parsed = typeof dbUser.interests === "string" ? JSON.parse(dbUser.interests) : dbUser.interests;
                setSelectedInterests(Array.isArray(parsed) ? parsed : []);
              } catch (e) {
                setSelectedInterests([]);
              }
            }
          }
        } else {
          if (isMounted) setFullName(typeof user === "string" ? user.split("@")[0] : "");
        }

        // Calculate attending count via API
        const resReg = await fetch(`/api/registrations?email=${encodeURIComponent(user)}`);
        const regData = await resReg.json();
        if (regData.success && isMounted) {
          setAttendingCount(regData.registrations.length);
        }

        // Fetch hosted events count from DB
        const res = await fetch("/api/events?includeArchived=true");
        const data = await res.json();
        if (data.success && isMounted) {
          const userHosted = data.events.filter((ev) => ev.organizer?.email === user || ev.organizerId === user);
          setHostedCount(userHosted.length);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (typeof window !== "undefined") {
      fetchProfileData();
    }
    
    return () => { isMounted = false; };
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (typeof window !== "undefined" && user) {
      try {
        const res = await fetch("/api/users/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user,
            interests: selectedInterests,
            dob: dob,
            fullName: fullName,
            department: track,
            portfolioUrl: github,
            bio: bio,
            team: team,
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.error("Profile save failed:", errData);
          return;
        }

        const payload = {
          fullName,
          bio,
          github,
          track,
          team,
          dob,
          interests: selectedInterests,
        };
        localStorage.setItem(`profile_${user}`, JSON.stringify(payload));

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        window.dispatchEvent(new Event("storage"));
        setIsEditing(false);
      } catch (err) {
        console.error("Profile save error:", err);
      }
    }
  };

  // Auth Guard
  if (!user) {
    return (
      <div className="min-h-[80vh] bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 bg-dark-card border border-dark-border p-8 rounded-2xl text-center shadow-neon">
          <span className="text-4xl block">🔒</span>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Login Required
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Please sign in to your campus builder account to view and customize
            your profile console.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full py-2.5 bg-neon-purple text-white text-xs font-bold rounded-lg hover:bg-neon-purple/95 transition-all shadow-neon"
            >
              Sign In to Campus Account
            </Link>
            <Link
              href="/"
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const initials = fullName ? fullName.substring(0, 2) : (typeof user === "string" ? user.substring(0, 2) : "U");

  return (
    <div className="relative isolate overflow-hidden bg-black w-full min-h-[85vh] py-12 sm:py-16">
      <div
        className="absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl opacity-25 animate-pulse"
        aria-hidden="true"
      >
        <div
          className="relative left-[50%] top-[10%] aspect-[1155/678] w-[45rem] -translate-x-1/2 bg-gradient-to-tr from-neon-purple to-neon-lavender"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold bg-neon-purple/10 text-neon-lavender border border-neon-purple/30 shadow-neon">
              <User className="h-3 w-3" /> Student Profile Console
            </span>
            <h1 className="text-3xl font-black text-white tracking-tight sm:text-4xl mt-3">
              Profile Settings
            </h1>
            <p className="text-xs text-gray-400 mt-1 leading-normal">
              Customize your student credentials, social links, and coordinate with campus clubs.
            </p>
          </div>
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-green-300 font-bold bg-green-950/20 border border-green-800/40 px-3.5 py-2 rounded-lg animate-fadeIn font-mono">
              <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
              Saved successfully!
            </span>
          )}
        </div>

        {loading ? (
          <div className="bg-dark-card border border-dark-border rounded-2xl p-10 animate-pulse h-96" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left side Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-neon flex flex-col items-center space-y-5">
                <div className="w-24 h-24 rounded-full bg-neon-purple/15 border-2 border-neon-purple/50 flex items-center justify-center text-3xl font-black text-neon-lavender uppercase tracking-widest ring-4 ring-neon-purple/10 shadow-[0_0_30px_rgba(191,64,255,0.4)] relative group select-none">
                  {initials}
                  <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 border border-dark-card animate-pulse" />
                </div>

                <div className="space-y-1 text-center w-full">
                  <h2 className="text-lg font-black text-white leading-normal truncate w-full px-2">
                    {fullName || (typeof user === "string" ? user.split("@")[0] : "User")}
                  </h2>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 font-mono">
                    <Mail className="h-3.5 w-3.5 text-neon-purple" />
                    <span className="truncate max-w-[180px]">{user}</span>
                  </div>
                </div>

                <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${rank.bg} ${rank.color} border ${rank.border}`}>
                  <span>{rank.icon}</span> {rank.name}
                </div>
              </div>

              {/* Console Metrics */}
              <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-neon space-y-4 font-mono">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-dark-border/40 pb-2 flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-neon-purple" /> Registration Index
                </h3>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <Link
                    href="/dashboard"
                    className="p-3 bg-zinc-900/60 hover:bg-neon-purple/5 border border-dark-border rounded-xl transition-all hover:border-neon-purple/30 group"
                  >
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                      Attending
                    </div>
                    <div className="text-xl font-black text-white group-hover:text-neon-purple mt-1">
                      {attendingCount}
                    </div>
                  </Link>

                  <Link
                    href="/dashboard"
                    className="p-3 bg-zinc-900/60 hover:bg-neon-purple/5 border border-dark-border rounded-xl transition-all hover:border-neon-purple/30 group"
                  >
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                      Hosting
                    </div>
                    <div className="text-xl font-black text-white group-hover:text-neon-purple mt-1">
                      {hostedCount}
                    </div>
                  </Link>
                </div>

                <div className="pt-4 border-t border-dark-border/40">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Activity className="w-3 h-3 text-neon-purple"/> Rank Progress
                      <button 
                        onClick={() => setShowRankModal(true)} 
                        className="ml-1 text-gray-500 hover:text-neon-lavender transition-colors rounded-full p-0.5 hover:bg-neon-purple/10"
                        title="View Rank Guide"
                      >
                        <Info className="w-3 h-3" />
                      </button>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-neon-purple">
                      {xp} <span className="text-gray-600">/ {rank.next || 'MAX'} XP</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-dark-border">
                    <div 
                      className="h-full bg-neon-purple shadow-[0_0_10px_rgba(191,64,255,0.5)] transition-all duration-1000 ease-out relative overflow-hidden" 
                      style={{ width: `${progressPercentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}></div>
                    </div>
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-neon-lavender hover:text-white transition-colors pt-1"
                >
                  Open Console Dashboard <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Right side Details */}
            <div className="lg:col-span-2">
              {isEditing ? (
                <form
                  onSubmit={handleSaveProfile}
                  className="bg-dark-card border border-neon-purple/30 rounded-2xl p-6 sm:p-8 shadow-[0_0_30px_rgba(191,64,255,0.1)] space-y-6 animate-fadeIn"
                >
                  <div className="border-b border-dark-border/40 pb-4 flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Edit2 className="h-4 w-4 text-neon-purple" /> Edit Student Profile
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                        Update your metadata. Changes will reflect across your event registrations.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="p-1.5 hover:bg-zinc-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label htmlFor="profile-fullname" className="block text-[10px] uppercase font-bold text-gray-400 font-mono">
                        Full Display Name
                      </label>
                      <input
                        id="profile-fullname"
                        required
                        type="text"
                        placeholder="e.g. John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="block w-full rounded-lg border border-dark-border bg-black px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="profile-github" className="block text-[10px] uppercase font-bold text-gray-400 font-mono">
                        Social Profile / Link
                      </label>
                      <div className="relative">
                        <Terminal className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
                        <input
                          id="profile-github"
                          type="url"
                          placeholder="https://github.com/user"
                          value={github}
                          onChange={(e) => setGithub(e.target.value)}
                          className="block w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-dark-border bg-black text-xs text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="profile-dob" className="block text-[10px] uppercase font-bold text-gray-400 font-mono">
                        Date of Birth
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
                        <input
                          id="profile-dob"
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="block w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-dark-border bg-black text-xs text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="profile-track" className="block text-[10px] uppercase font-bold text-gray-400 font-mono">
                        Institute
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
                        <select
                          id="profile-track"
                          value={track}
                          onChange={(e) => setTrack(e.target.value)}
                          className="block w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-dark-border bg-black text-xs text-white focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple font-mono appearance-none"
                        >
                          <option value="Computer Science & Tech">Computer Science & Tech</option>
                          <option value="Engineering & Applied Sciences">Engineering & Applied Sciences</option>
                          <option value="Business & Economics">Business & Economics</option>
                          <option value="Fine Arts & Design">Fine Arts & Design</option>
                          <option value="Humanities & Liberal Arts">Humanities & Liberal Arts</option>
                          <option value="Natural Sciences">Natural Sciences</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-[10px] uppercase font-bold text-gray-400 font-mono">
                        Interests
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {SUGGESTED_CATEGORIES.map(category => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => {
                              setSelectedInterests(prev => 
                                prev.includes(category) 
                                  ? prev.filter(c => c !== category)
                                  : [...prev, category]
                              )
                            }}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                              selectedInterests.includes(category)
                                ? "bg-neon-purple text-white border-neon-purple shadow-[0_0_10px_rgba(191,64,255,0.4)] scale-[1.02]"
                                : "bg-zinc-900/50 text-gray-400 border border-dark-border hover:bg-zinc-800 hover:text-white"
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="profile-bio" className="block text-[10px] uppercase font-bold text-gray-400 font-mono">
                      Biography / Status Bio
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
                      <textarea
                        id="profile-bio"
                        rows={3}
                        placeholder="Share your branch, interests, and active club associations..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="block w-full pl-10 pr-3.5 py-3 rounded-lg border border-dark-border bg-black text-xs text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple font-mono resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4 border-t border-dark-border/40">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="w-full sm:w-auto px-6 py-3 bg-transparent hover:bg-zinc-900 border border-dark-border text-gray-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-3 bg-neon-purple hover:bg-neon-purple/95 text-white text-xs font-black uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-neon transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Save className="h-4 w-4" /> Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 shadow-neon space-y-8 animate-fadeIn h-full">
                  <div className="border-b border-dark-border/40 pb-4 flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <User className="h-4 w-4 text-neon-purple" /> Profile Details
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                        Your visible campus profile information.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-neon-purple/10 text-neon-lavender hover:bg-neon-purple hover:text-white border border-neon-purple/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(191,64,255,0.15)]"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider font-mono flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-neon-purple" /> Institute
                      </p>
                      <p className="text-sm text-white font-medium">{track || <span className="text-gray-600 italic text-xs">Not specified</span>}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider font-mono flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-neon-purple" /> Date of Birth
                      </p>
                      <p className="text-sm text-white font-medium">{dob || <span className="text-gray-600 italic text-xs">Not specified</span>}</p>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider font-mono flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-neon-purple" /> Interests
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedInterests.length > 0 ? selectedInterests.map(interest => (
                          <span key={interest} className="px-2.5 py-1 bg-neon-purple/10 border border-neon-purple/30 text-neon-lavender rounded-lg text-[11px] font-bold tracking-wide">
                            {interest}
                          </span>
                        )) : <span className="text-gray-600 italic text-xs">No interests selected</span>}
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider font-mono flex items-center gap-1.5">
                        <Terminal className="h-3.5 w-3.5 text-neon-purple" /> Social Profile / Link
                      </p>
                      {github ? (
                        <a href={github} target="_blank" rel="noopener noreferrer" className="text-sm text-neon-lavender hover:underline break-all inline-flex items-center gap-1">
                          {github.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-600 italic">Not provided</span>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider font-mono flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-neon-purple" /> Biography
                      </p>
                      {bio ? (
                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-dark-border/50 text-sm text-gray-300 leading-relaxed italic">
                          &quot;{bio}&quot;
                        </div>
                      ) : (
                        <span className="text-xs text-gray-600 italic">No biography provided</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rank Guide Modal */}
      {showRankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-md p-6 shadow-neon relative animate-fadeIn">
            <button 
              onClick={() => setShowRankModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-neon-purple" />
              <h3 className="text-lg font-bold text-white">Campus Rank Guide</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Earn XP by attending events (+10 XP) and hosting campus events (+50 XP).
            </p>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center p-2 rounded bg-amber-600/10 border border-amber-600/30 text-amber-500">
                <span>🥉 Freshman</span>
                <span>0 - 49 XP</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-zinc-400/10 border border-zinc-400/30 text-zinc-300">
                <span>🥈 Sophomore</span>
                <span>50 - 99 XP</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-yellow-400/10 border border-yellow-400/30 text-yellow-400">
                <span>🥇 Junior</span>
                <span>100 - 249 XP</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-purple-400/10 border border-purple-400/30 text-purple-400">
                <span>🌟 Senior</span>
                <span>250 - 499 XP</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-emerald-400/10 border border-emerald-400/30 text-emerald-400">
                <span>👑 Campus Legend</span>
                <span>500+ XP</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}