import React, { useEffect, useState } from "react";
import { getAuthUser } from "../../utils/auth.js";
import "./MeetPage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function generateMeetLink() {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const seg = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`;
}

function formatDT(v) {
  if (!v) return "";
  const d = new Date(v);
  return d.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function isPast(v) { return v && new Date(v) < new Date(); }

export default function MeetPage() {
  const auth = getAuthUser();
  const [meetings, setMeetings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [form, setForm] = useState({ title: "", scheduledAt: "", invitees: [], meetLink: generateMeetLink() });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [mr, er] = await Promise.all([
        fetch(`${API_URL}/meetings`, { headers: { Authorization: `Bearer ${auth?.token}` } }),
        fetch(`${API_URL}/auth/employees`, { headers: { Authorization: `Bearer ${auth?.token}` } }),
      ]);
      const md = await mr.json();
      const ed = await er.json();
      if (md.success) setMeetings(md.meetings);
      if (ed.success) setEmployees(ed.employees.filter(e => String(e._id) !== String(auth?.employeeId)));
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
        setForm({ title: "", scheduledAt: "", invitees: [], meetLink: generateMeetLink() });
      } else { setError(data.message || "Failed to schedule"); }
    } catch (err) { setError("Network error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/meetings/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${auth?.token}` } });
      setMeetings(prev => prev.filter(m => String(m.id) !== String(id)));
    } catch (e) { console.error(e); }
  };

  const toggleInvitee = (id) => {
    setForm(f => ({
      ...f,
      invitees: f.invitees.includes(id) ? f.invitees.filter(i => i !== id) : [...f.invitees, id],
    }));
  };

  const upcoming = meetings.filter(m => !isPast(m.scheduledAt));
  const past = meetings.filter(m => isPast(m.scheduledAt));

  return (
    <div className="meetPage">
      {/* Header */}
      <div className="meetHeader">
        <div className="meetHeaderLeft">
          <div className="meetLogo">
            <svg viewBox="0 0 48 48" width="32" height="32">
              <path fill="#4285F4" d="M44 24c0-1.3-.1-2.5-.3-3.7H24v7h11.3c-.5 2.5-1.9 4.6-4 6v5h6.5C41.2 35 44 30 44 24z"/>
              <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.5-5c-1.8 1.2-4.1 1.9-7 1.9-5.4 0-9.9-3.6-11.5-8.5H5.8v5.2C9.1 39.8 16 44 24 44z"/>
              <path fill="#FBBC05" d="M12.5 27.5c-.4-1.2-.7-2.5-.7-3.8s.2-2.6.7-3.8v-5.2H5.8C4.6 17.1 4 20.5 4 24s.6 6.9 1.8 9.3l6.7-5.8z"/>
              <path fill="#EA4335" d="M24 12.5c3 0 5.7 1 7.8 3l5.8-5.8C34.1 6.5 29.4 4.5 24 4.5 16 4.5 9.1 8.7 5.8 15.2l6.7 5.2c1.6-4.9 6.1-7.9 11.5-7.9z"/>
            </svg>
          </div>
          <div>
            <h1 className="meetTitle">Google Meet</h1>
            <p className="meetSubtitle">Video calls for your team</p>
          </div>
        </div>
        <div className="meetHeaderActions">
          <a href={generateMeetLink()} target="_blank" rel="noopener noreferrer" className="meetBtn meetBtnOutline">
            🔗 Join with link
          </a>
          <button className="meetBtn meetBtnPrimary" onClick={() => setShowSchedule(true)}>
            + New meeting
          </button>
        </div>
      </div>

      {/* Instant join card */}
      <div className="meetInstantCard">
        <div className="meetInstantLeft">
          <div className="meetInstantIcon">📹</div>
          <div>
            <div className="meetInstantTitle">Start an instant meeting</div>
            <div className="meetInstantSub">Share the link with your team to join</div>
          </div>
        </div>
        <a href={generateMeetLink()} target="_blank" rel="noopener noreferrer" className="meetBtn meetBtnGreen">
          Start now
        </a>
      </div>

      {loading ? (
        <div className="meetLoading">Loading meetings…</div>
      ) : (
        <>
          {/* Upcoming */}
          <div className="meetSection">
            <div className="meetSectionTitle">Upcoming meetings</div>
            {upcoming.length === 0 ? (
              <div className="meetEmpty">No upcoming meetings. Schedule one!</div>
            ) : (
              <div className="meetList">
                {upcoming.map(m => (
                  <MeetCard key={m.id} meeting={m} auth={auth} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div className="meetSection">
              <div className="meetSectionTitle">Past meetings</div>
              <div className="meetList">
                {past.map(m => (
                  <MeetCard key={m.id} meeting={m} auth={auth} onDelete={handleDelete} past />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Schedule modal */}
      {showSchedule && (
        <div className="meetModalOverlay" onClick={() => setShowSchedule(false)}>
          <div className="meetModal" onClick={e => e.stopPropagation()}>
            <div className="meetModalHeader">
              <h2>Schedule a meeting</h2>
              <button className="meetModalClose" onClick={() => setShowSchedule(false)}>✕</button>
            </div>
            <form className="meetForm" onSubmit={handleSchedule}>
              <label>
                <span>Meeting title</span>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Weekly sync" required />
              </label>
              <label>
                <span>Date & Time</span>
                <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} required />
              </label>
              <label>
                <span>Meet link (auto-generated)</span>
                <div className="meetLinkRow">
                  <input type="text" value={form.meetLink} onChange={e => setForm(f => ({ ...f, meetLink: e.target.value }))} />
                  <button type="button" className="meetRefreshBtn" onClick={() => setForm(f => ({ ...f, meetLink: generateMeetLink() }))} title="Generate new link">↻</button>
                </div>
              </label>
              {employees.length > 0 && (
                <div className="meetInviteSection">
                  <span>Invite people</span>
                  <div className="meetInviteList">
                    {employees.map(emp => (
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
                <button type="submit" className="meetBtn meetBtnPrimary" disabled={saving}>{saving ? "Saving…" : "Schedule"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MeetCard({ meeting, auth, onDelete, past }) {
  const isOwner = String(meeting.createdBy?.id) === String(auth?.employeeId);
  return (
    <div className={`meetCard ${past ? "meetCardPast" : ""}`}>
      <div className="meetCardLeft">
        <div className="meetCardIcon">📅</div>
        <div>
          <div className="meetCardTitle">{meeting.title}</div>
          <div className="meetCardTime">{formatDT(meeting.scheduledAt)}</div>
          <div className="meetCardHost">Hosted by {meeting.createdBy?.name || "You"}</div>
          {meeting.invitees?.length > 0 && (
            <div className="meetCardInvitees">
              {meeting.invitees.map(i => (
                <span key={i.id} className="meetCardInviteeChip">{i.name}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="meetCardActions">
        {!past && (
          <a href={meeting.meet_link} target="_blank" rel="noopener noreferrer" className="meetBtn meetBtnGreen meetBtnSm">
            Join
          </a>
        )}
        <button className="meetCopyBtn" onClick={() => navigator.clipboard.writeText(meeting.meet_link)} title="Copy link">🔗</button>
        {isOwner && (
          <button className="meetDeleteBtn" onClick={() => onDelete(meeting.id)} title="Delete">🗑</button>
        )}
      </div>
    </div>
  );
}
