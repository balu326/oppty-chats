import React, { useEffect, useRef, useState } from "react";
import { getAuthUser } from "../../utils/auth.js";
import "./MeetPage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const SAVED_LINKS_KEY = "oppty_meet_saved_links";

function generateMeetLink() {
  const c = "abcdefghijklmnopqrstuvwxyz";
  const s = (n) => Array.from({ length: n }, () => c[Math.floor(Math.random() * c.length)]).join("");
  return `https://meet.google.com/${s(3)}-${s(4)}-${s(3)}`;
}

function formatDT(v) {
  if (!v) return "";
  return new Date(v).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatTimeOnly(v) {
  if (!v) return "";
  const d = new Date(v);
  const now = new Date();
  const diff = d - now;
  if (diff > 0 && diff < 3600000) return `in ${Math.round(diff / 60000)} min`;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isPast(v) { return v && new Date(v) < new Date(); }

function loadSavedLinks() {
  try { return JSON.parse(localStorage.getItem(SAVED_LINKS_KEY) || "[]"); } catch { return []; }
}
function saveSavedLinks(links) {
  localStorage.setItem(SAVED_LINKS_KEY, JSON.stringify(links));
}

function GoogleMeetLogo({ size = 28 }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size}>
      <path fill="#4285F4" d="M44 24c0-1.3-.1-2.5-.3-3.7H24v7h11.3c-.5 2.5-1.9 4.6-4 6v5h6.5C41.2 35 44 30 44 24z"/>
      <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.5-5c-1.8 1.2-4.1 1.9-7 1.9-5.4 0-9.9-3.6-11.5-8.5H5.8v5.2C9.1 39.8 16 44 24 44z"/>
      <path fill="#FBBC05" d="M12.5 27.5c-.4-1.2-.7-2.5-.7-3.8s.2-2.6.7-3.8v-5.2H5.8C4.6 17.1 4 20.5 4 24s.6 6.9 1.8 9.3l6.7-5.8z"/>
      <path fill="#EA4335" d="M24 12.5c3 0 5.7 1 7.8 3l5.8-5.8C34.1 6.5 29.4 4.5 24 4.5 16 4.5 9.1 8.7 5.8 15.2l6.7 5.2c1.6-4.9 6.1-7.9 11.5-7.9z"/>
    </svg>
  );
}

export default function MeetPage() {
  const auth = getAuthUser();
  const [meetings, setMeetings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [form, setForm] = useState({ title: "", scheduledAt: "", invitees: [], meetLink: generateMeetLink(), linkName: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [inviteTab, setInviteTab] = useState("all");
  const [savedLinks, setSavedLinks] = useState(loadSavedLinks);
  const [showSaveLinkModal, setShowSaveLinkModal] = useState(false);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState(generateMeetLink());
  const [copied, setCopied] = useState(null);
  const instantLink = useRef(generateMeetLink()).current;

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [mr, er, gr] = await Promise.all([
        fetch(`${API_URL}/meetings`, { headers: { Authorization: `Bearer ${auth?.token}` } }),
        fetch(`${API_URL}/auth/employees`, { headers: { Authorization: `Bearer ${auth?.token}` } }),
        fetch(`${API_URL}/groups`, { headers: { Authorization: `Bearer ${auth?.token}` } }),
      ]);
      const [md, ed, gd] = await Promise.all([mr.json(), er.json(), gr.json()]);
      if (md.success) setMeetings(md.meetings);
      if (ed.success) setEmployees(ed.employees.filter(e => String(e._id) !== String(auth?.employeeId)));
      if (gd.success) setGroups(gd.groups);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.scheduledAt) { setError("Title and date/time are required"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API_URL}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth?.token}` },
        body: JSON.stringify({ title: form.title.trim(), meetLink: form.meetLink, scheduledAt: form.scheduledAt, invitees: form.invitees }),
      });
      const data = await res.json();
      if (data.success) {
        setMeetings(prev => [...prev, data.meeting].sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)));
        setShowSchedule(false);
        setForm({ title: "", scheduledAt: "", invitees: [], meetLink: generateMeetLink(), linkName: "" });
        setInviteTab("all");
      } else { setError(data.message || "Failed"); }
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/meetings/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${auth?.token}` } });
    setMeetings(prev => prev.filter(m => String(m.id) !== String(id)));
  };

  const toggleInvitee = (id) => {
    setForm(f => ({ ...f, invitees: f.invitees.includes(id) ? f.invitees.filter(i => i !== id) : [...f.invitees, id] }));
  };

  const handleSaveLink = () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) return;
    const updated = [...savedLinks, { id: Date.now(), name: newLinkName.trim(), url: newLinkUrl.trim() }];
    setSavedLinks(updated);
    saveSavedLinks(updated);
    setShowSaveLinkModal(false);
    setNewLinkName(""); setNewLinkUrl(generateMeetLink());
  };

  const handleDeleteSavedLink = (id) => {
    const updated = savedLinks.filter(l => l.id !== id);
    setSavedLinks(updated);
    saveSavedLinks(updated);
  };

  const copyLink = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const upcoming = meetings.filter(m => !isPast(m.scheduledAt));
  const past = meetings.filter(m => isPast(m.scheduledAt));

  const visibleEmployees = inviteTab === "all"
    ? employees
    : employees.filter(emp => {
        const grp = groups.find(g => g._id === inviteTab);
        return (grp?.members || []).some(m => String(m._id) === String(emp._id));
      });

  return (
    <div className="meetPage">

      {/* ── Top nav ── */}
      <nav className="meetNav">
        <div className="meetNavBrand">
          <GoogleMeetLogo size={24} />
          <span>Meet</span>
        </div>
        <div className="meetNavActions">
          <button className="meetNavBtn outline" onClick={() => { setShowSaveLinkModal(true); }}>
            🔖 Save link
          </button>
          <button className="meetNavBtn primary" onClick={() => setShowSchedule(true)}>
            + New meeting
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="meetHero">
        <div className="meetHeroBg" />
        <div className="meetHeroContent">
          <div className="meetHeroLeft">
            <div className="meetHeroBadge">
              <GoogleMeetLogo size={18} />
              <span>Google Meet for Oppty</span>
            </div>
            <h1 className="meetHeroTitle">Video calls,<br />made simple</h1>
            <p className="meetHeroSub">Connect your team instantly. Schedule, join, and manage meetings — all in one place.</p>
            <div className="meetHeroActions">
              <a href={instantLink} target="_blank" rel="noopener noreferrer" className="meetHeroBtn primary">
                <span className="meetHeroBtnIcon">▶</span> Start now
              </a>
              <button className="meetHeroBtn ghost" onClick={() => setShowSchedule(true)}>
                📅 Schedule
              </button>
            </div>
          </div>
          <div className="meetHeroRight">
            <div className="meetHeroCard">
              <div className="meetHeroCardTop">
                <div className="meetHeroCardDot red" /><div className="meetHeroCardDot yellow" /><div className="meetHeroCardDot green" />
              </div>
              <div className="meetHeroCardFaces">
                {["👩‍💼","👨‍💻","👩‍🔬","👨‍🎨"].map((e,i) => (
                  <div key={i} className="meetHeroFace">{e}</div>
                ))}
              </div>
              <div className="meetHeroCardLabel">4 participants · Live</div>
              <div className="meetHeroCardBar">
                {[3,5,4,6,3,5,4,3,6,4,5,3].map((h,i) => (
                  <div key={i} className="meetHeroBarSegment" style={{ height: h*4 }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="meetBody">

        {/* ── Stats ── */}
        <div className="meetStats">
          {[
            { icon: "📅", num: upcoming.length, label: "Upcoming", color: "blue" },
            { icon: "✅", num: past.length,     label: "Completed", color: "green" },
            { icon: "👥", num: employees.length + 1, label: "Team size", color: "purple" },
            { icon: "🔖", num: savedLinks.length, label: "Saved links", color: "blue" },
          ].map(s => (
            <div key={s.label} className={`meetStatCard ${s.color}`}>
              <div className="meetStatEmoji">{s.icon}</div>
              <div className="meetStatNum">{s.num}</div>
              <div className="meetStatLabel">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Saved links ── */}
        {savedLinks.length > 0 && (
          <div className="meetSection">
            <div className="meetSectionHeader">
              <div className="meetSectionTitle">🔖 Saved links</div>
              <button className="meetSectionAction" onClick={() => setShowSaveLinkModal(true)}>+ Add</button>
            </div>
            <div className="meetSavedGrid">
              {savedLinks.map(link => (
                <div key={link.id} className="meetSavedCard">
                  <div className="meetSavedIcon"><GoogleMeetLogo size={20} /></div>
                  <div className="meetSavedInfo">
                    <div className="meetSavedName">{link.name}</div>
                    <div className="meetSavedUrl">{link.url.replace("https://", "")}</div>
                  </div>
                  <div className="meetSavedActions">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="meetSavedJoin">Join</a>
                    <button className="meetSavedCopy" onClick={() => copyLink(link.url, link.id)} title="Copy">
                      {copied === link.id ? "✓" : "🔗"}
                    </button>
                    <button className="meetSavedDel" onClick={() => handleDeleteSavedLink(link.id)} title="Remove">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="meetLoading">
            <div className="meetLoadingSpinner" />
            Loading meetings…
          </div>
        ) : (
          <>
            {/* ── Upcoming ── */}
            <div className="meetSection">
              <div className="meetSectionHeader">
                <div className="meetSectionTitle">📅 Upcoming meetings</div>
                <button className="meetSectionAction" onClick={() => setShowSchedule(true)}>+ Schedule</button>
              </div>
              {upcoming.length === 0 ? (
                <div className="meetEmpty">
                  <div className="meetEmptyIcon">📭</div>
                  <div className="meetEmptyTitle">No upcoming meetings</div>
                  <div className="meetEmptySub">Schedule one to get your team together</div>
                  <button className="meetBtn meetBtnPrimary" style={{ marginTop: 14 }} onClick={() => setShowSchedule(true)}>
                    + Schedule meeting
                  </button>
                </div>
              ) : (
                <div className="meetList">
                  {upcoming.map(m => <MeetCard key={m.id} meeting={m} auth={auth} onDelete={handleDelete} onCopy={copyLink} copied={copied} />)}
                </div>
              )}
            </div>

            {past.length > 0 && (
              <div className="meetSection">
                <div className="meetSectionHeader">
                  <div className="meetSectionTitle">🕐 Past meetings</div>
                </div>
                <div className="meetList">
                  {past.map(m => <MeetCard key={m.id} meeting={m} auth={auth} onDelete={handleDelete} onCopy={copyLink} copied={copied} past />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Schedule modal ── */}
      {showSchedule && (
        <div className="meetModalOverlay" onClick={() => setShowSchedule(false)}>
          <div className="meetModal" onClick={e => e.stopPropagation()}>
            <div className="meetModalHeader">
              <div className="meetModalHeaderLeft">
                <GoogleMeetLogo size={22} />
                <h2>New meeting</h2>
              </div>
              <button className="meetModalClose" onClick={() => setShowSchedule(false)}>✕</button>
            </div>
            <form className="meetForm" onSubmit={handleSchedule}>
              <div className="meetFormGroup">
                <label className="meetFormLabel">Meeting title</label>
                <input className="meetFormInput" type="text" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Weekly sync, Sprint review…" required />
              </div>

              <div className="meetFormGroup">
                <label className="meetFormLabel">Date & Time</label>
                <input className="meetFormInput" type="datetime-local" value={form.scheduledAt}
                  onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} required />
              </div>

              {/* Meet link — dropdown of saved + custom */}
              <div className="meetFormGroup">
                <label className="meetFormLabel">Meet link</label>
                {savedLinks.length > 0 && (
                  <select className="meetFormInput meetFormSelect"
                    value={form.linkName}
                    onChange={e => {
                      const chosen = savedLinks.find(l => l.name === e.target.value);
                      setForm(f => ({ ...f, linkName: e.target.value, meetLink: chosen ? chosen.url : generateMeetLink() }));
                    }}
                    style={{ marginBottom: 8 }}
                  >
                    <option value="">— Use custom / generate new —</option>
                    {savedLinks.map(l => (
                      <option key={l.id} value={l.name}>{l.name}</option>
                    ))}
                  </select>
                )}
                <div className="meetLinkRow">
                  <input className="meetFormInput" type="text" value={form.meetLink}
                    onChange={e => setForm(f => ({ ...f, meetLink: e.target.value, linkName: "" }))} />
                  <button type="button" className="meetRefreshBtn"
                    onClick={() => setForm(f => ({ ...f, meetLink: generateMeetLink(), linkName: "" }))} title="Generate">↻</button>
                </div>
              </div>

              {/* Invite */}
              {employees.length > 0 && (
                <div className="meetFormGroup">
                  <div className="meetInviteHeader">
                    <label className="meetFormLabel">Invite people ({form.invitees.length} selected)</label>
                    <button type="button" className="meetSelectAllBtn"
                      onClick={() => {
                        if (inviteTab === "all") {
                          setForm(f => ({ ...f, invitees: f.invitees.length === employees.length ? [] : employees.map(e => e._id) }));
                        } else {
                          const grp = groups.find(g => g._id === inviteTab);
                          const ids = (grp?.members || []).map(m => String(m._id)).filter(id => id !== String(auth?.employeeId));
                          const all = ids.every(id => form.invitees.includes(id));
                          setForm(f => ({ ...f, invitees: all ? f.invitees.filter(id => !ids.includes(id)) : [...new Set([...f.invitees, ...ids])] }));
                        }
                      }}
                    >
                      {inviteTab === "all"
                        ? (form.invitees.length === employees.length ? "Deselect all" : "Select all")
                        : (() => {
                            const grp = groups.find(g => g._id === inviteTab);
                            const ids = (grp?.members || []).map(m => String(m._id)).filter(id => id !== String(auth?.employeeId));
                            return ids.every(id => form.invitees.includes(id)) ? "Deselect group" : "Select group";
                          })()
                      }
                    </button>
                  </div>
                  <div className="meetInviteTabBar">
                    <button type="button" className={`meetInviteTab ${inviteTab === "all" ? "active" : ""}`} onClick={() => setInviteTab("all")}>All</button>
                    {groups.map(g => (
                      <button key={g._id} type="button" className={`meetInviteTab ${inviteTab === g._id ? "active" : ""}`} onClick={() => setInviteTab(g._id)}>
                        {g.name}
                      </button>
                    ))}
                  </div>
                  <div className="meetInviteList">
                    {visibleEmployees.map(emp => (
                      <label key={emp._id} className="meetInviteItem">
                        <input type="checkbox" checked={form.invitees.includes(emp._id)} onChange={() => toggleInvitee(emp._id)} />
                        <div className="meetInviteAvatar">{emp.name.slice(0, 1).toUpperCase()}</div>
                        <div>
                          <div className="meetInviteName">{emp.name}</div>
                          <div className="meetInviteEmail">{emp.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {error && <div className="meetError">{error}</div>}
              <div className="meetFormActions">
                <button type="button" className="meetBtn meetBtnOutline" onClick={() => setShowSchedule(false)}>Cancel</button>
                <button type="submit" className="meetBtn meetBtnPrimary" disabled={saving}>
                  {saving ? "Scheduling…" : "Schedule meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Save link modal ── */}
      {showSaveLinkModal && (
        <div className="meetModalOverlay" onClick={() => setShowSaveLinkModal(false)}>
          <div className="meetModal meetModalSm" onClick={e => e.stopPropagation()}>
            <div className="meetModalHeader">
              <div className="meetModalHeaderLeft"><span>🔖</span><h2>Save a Meet link</h2></div>
              <button className="meetModalClose" onClick={() => setShowSaveLinkModal(false)}>✕</button>
            </div>
            <div className="meetForm">
              <div className="meetFormGroup">
                <label className="meetFormLabel">Link name</label>
                <input className="meetFormInput" type="text" value={newLinkName}
                  onChange={e => setNewLinkName(e.target.value)} placeholder="e.g. Daily standup, Team room…" />
              </div>
              <div className="meetFormGroup">
                <label className="meetFormLabel">Meet URL</label>
                <div className="meetLinkRow">
                  <input className="meetFormInput" type="text" value={newLinkUrl}
                    onChange={e => setNewLinkUrl(e.target.value)} />
                  <button type="button" className="meetRefreshBtn" onClick={() => setNewLinkUrl(generateMeetLink())}>↻</button>
                </div>
              </div>
              <div className="meetFormActions">
                <button className="meetBtn meetBtnOutline" onClick={() => setShowSaveLinkModal(false)}>Cancel</button>
                <button className="meetBtn meetBtnPrimary" onClick={handleSaveLink} disabled={!newLinkName.trim()}>Save link</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MeetCard({ meeting, auth, onDelete, onCopy, copied, past }) {
  const isOwner = String(meeting.createdBy?.id) === String(auth?.employeeId);
  const timeLabel = past ? formatDT(meeting.scheduledAt) : formatTimeOnly(meeting.scheduledAt);
  return (
    <div className={`meetCard ${past ? "meetCardPast" : ""}`}>
      <div className="meetCardAccent" />
      <div className="meetCardLeft">
        <div className="meetCardIconWrap">
          <GoogleMeetLogo size={22} />
        </div>
        <div className="meetCardInfo">
          <div className="meetCardTitle">{meeting.title}</div>
          <div className="meetCardMeta">
            <span className="meetCardTime">🕐 {formatDT(meeting.scheduledAt)}</span>
            {!past && <span className="meetCardCountdown">{timeLabel}</span>}
          </div>
          <div className="meetCardHost">Hosted by {meeting.createdBy?.name || "You"}</div>
          {meeting.invitees?.length > 0 && (
            <div className="meetCardInvitees">
              {meeting.invitees.slice(0, 4).map(i => (
                <div key={i.id} className="meetCardInviteeAvatar" title={i.name}>{i.name.slice(0,1).toUpperCase()}</div>
              ))}
              {meeting.invitees.length > 4 && <div className="meetCardInviteeMore">+{meeting.invitees.length - 4}</div>}
            </div>
          )}
        </div>
      </div>
      <div className="meetCardActions">
        {!past && (
          <a href={meeting.meet_link} target="_blank" rel="noopener noreferrer" className="meetJoinBtn">
            <span>▶</span> Join
          </a>
        )}
        <button className="meetIconBtn" onClick={() => onCopy(meeting.meet_link, meeting.id)} title="Copy link">
          {copied === meeting.id ? "✓" : "🔗"}
        </button>
        {isOwner && <button className="meetIconBtn danger" onClick={() => onDelete(meeting.id)} title="Delete">🗑</button>}
      </div>
    </div>
  );
}
