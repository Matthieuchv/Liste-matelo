import { useState, useEffect, useRef } from "react";

const API = "https://kvdb.io/9BzxQLB6fgkXnhKEHRCpVD/";

const PALETTE = {
  bg: "#F7F4FB", card: "#FFFFFF", primary: "#9B7FD4", primaryLight: "#EDE7F6",
  accentLight: "#FCE4EC", text: "#2D2040", muted: "#9E8DB0",
  doneLine: "#66BB6A", shadow: "0 4px 24px rgba(155,127,212,0.10)",
};

async function loadData(key) {
  try {
    const res = await fetch(API + key);
    if (!res.ok) return [];
    const text = await res.text();
    return JSON.parse(text) || [];
  } catch { return []; }
}

async function saveData(key, items) {
  await fetch(API + key, { method: "POST", body: JSON.stringify(items) });
}

function CheckCircle({ checked, color }) {
  return (
    <div style={{ width: 26, height: 26, borderRadius: "50%", border: checked ? "none" : `2.5px solid ${color}`, background: checked ? color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.25s", cursor: "pointer" }}>
      {checked && (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>)}
    </div>
  );
}

function TaskItem({ item, onToggle, onDelete, accentColor }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: 14, background: item.done ? "#F1FBF2" : PALETTE.card, border: `1.5px solid ${item.done ? "#A5D6A7" : "#EDE7F6"}`, marginBottom: 8, position: "relative", overflow: "hidden" }}>
      {item.done && (<div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: PALETTE.doneLine }} />)}
      <div onClick={() => onToggle(item.id)} style={{ cursor: "pointer" }}>
        <CheckCircle checked={item.done} color={item.done ? PALETTE.doneLine : accentColor} />
      </div>
      <span style={{ flex: 1, fontSize: 15, color: item.done ? "#8ab88c" : PALETTE.text, textDecoration: item.done ? "line-through" : "none", fontWeight: item.done ? 400 : 500, wordBreak: "break-word" }}>
        {item.text}
        {item.done && (<span style={{ marginLeft: 8, fontSize: 12, color: PALETTE.doneLine, fontWeight: 600, background: "#E8F5E9", borderRadius: 20, padding: "2px 8px" }}>✓ Fait !</span>)}
      </span>
      <button onClick={() => onDelete(item.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", color: "#BDBDBD", fontSize: 17 }}>×</button>
    </div>
  );
}

function Section({ title, emoji, storageKey, accentColor, bgAccent }) {
  const [items, setItems] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const inputRef = useRef();
  const saving = useRef(false);
  const inputRef2 = useRef("");

  const fetchData = async () => {
    if (saving.current) return;
    if (inputRef2.current !== "") return;
    const data = await loadData(storageKey);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const poll = setInterval(fetchData, 6000);
    return () => clearInterval(poll);
  }, []);

  const handleInput = (val) => {
    setInput(val);
    inputRef2.current = val;
  };

  const saveItems = async (newItems) => {
    saving.current = true;
    setItems(newItems);
    setSyncing(true);
    await saveData(storageKey, newItems);
    setSyncing(false);
    setTimeout(() => { saving.current = false; }, 2000);
  };

  const addItem = async () => {
    const text = input.trim();
    if (!text) return;
    handleInput("");
    await saveItems([...items, { id: Date.now(), text, done: false }]);
    inputRef.current?.focus();
  };

  const doneCount = items.filter(i => i.done).length;
  const total = items.length;

  return (
    <div style={{ background: PALETTE.card, borderRadius: 22, boxShadow: PALETTE.shadow, padding: "24px 22px 20px", flex: "1 1 340px", minWidth: 300, maxWidth: 520 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 18, gap: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: bgAccent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: PALETTE.text }}>{title}</div>
          {total > 0 && (<div style={{ fontSize: 12, color: PALETTE.muted, marginTop: 2 }}>{doneCount}/{total} effectuée{doneCount > 1 ? "s" : ""}</div>)}
        </div>
        {syncing && <div style={{ fontSize: 11, color: PALETTE.muted }}>⏳ sync...</div>}
      </div>
      {total > 0 && (
        <div style={{ height: 5, borderRadius: 99, background: "#F0EBF8", marginBottom: 18, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(doneCount / total) * 100}%`, background: accentColor, borderRadius: 99, transition: "width 0.4s ease" }} />
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input ref={inputRef} value={input} onChange={e => handleInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem()} placeholder="Ajouter un élément..." style={{ flex: 1, border: `1.5px solid #E8DFF6`, borderRadius: 12, padding: "10px 14px", fontSize: 14, outline: "none", background: PALETTE.bg, color: PALETTE.text, fontFamily: "inherit" }} />
        <button onClick={addItem} style={{ background: accentColor, border: "none", borderRadius: 12, width: 42, height: 42, cursor: "pointer", fontSize: 22, color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>+</button>
      </div>
      <div>
        {loading ? (
          <div style={{ textAlign: "center", padding: 24, color: PALETTE.muted, fontSize: 14 }}>Chargement…</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 12px", color: PALETTE.muted, fontSize: 14, border: "1.5px dashed #DDD5F0", borderRadius: 14 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{emoji}</div>
            Ajoutez votre première tâche !
          </div>
        ) : (
          <>
            {items.filter(i => !i.done).map(item => (<TaskItem key={item.id} item={item} onToggle={(id) => saveItems(items.map(i => i.id === id ? { ...i, done: !i.done } : i))} onDelete={(id) => saveItems(items.filter(i => i.id !== id))} accentColor={accentColor} />))}
            {items.filter(i => i.done).length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 600, color: PALETTE.muted, textTransform: "uppercase", margin: "14px 4px 8px" }}>Effectuées</div>
                {items.filter(i => i.done).map(item => (<TaskItem key={item.id} item={item} onToggle={(id) => saveItems(items.map(i => i.id === id ? { ...i, done: !i.done } : i))} onDelete={(id) => saveItems(items.filter(i => i.id !== id))} accentColor={accentColor} />))}
              </>
            )}
          </>
        )}
      </div>
      {doneCount > 0 && (<button onClick={() => saveItems(items.filter(i => !i.done))} style={{ marginTop: 12, background: "none", border: "1.5px solid #E0D7F0", borderRadius: 10, padding: "7px 14px", fontSize: 12, color: PALETTE.muted, cursor: "pointer", width: "100%", fontFamily: "inherit" }}>Effacer les tâches effectuées ({doneCount})</button>)}
    </div>
  );
}

export default function App() {
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, #F3EDFC 0%, #FCE4EC 100%)`, fontFamily: "'Inter', 'Segoe UI', sans-serif", padding: "32px 16px 48px" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>💑</div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: PALETTE.text }}>Notre espace partagé</h1>
        <p style={{ margin: "8px 0 0", color: PALETTE.muted, fontSize: 15 }}>Organisez votre quotidien ensemble ✨</p>
        <p style={{ margin: "4px 0 0", color: PALETTE.muted, fontSize: 12 }}>🔄 Synchronisé toutes les 6 secondes</p>
      </div>
      <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", maxWidth: 1100, margin: "0 auto" }}>
        <Section title="Tâches ménagères" emoji="🏠" storageKey="tasks" accentColor={PALETTE.primary} bgAccent={PALETTE.primaryLight} />
        <Section title="Liste de courses" emoji="🛒" storageKey="shopping" accentColor="#E91E8C" bgAccent={PALETTE.accentLight} />
      </div>
      <p style={{ textAlign: "center", marginTop: 32, fontSize: 12, color: "#C9BDD8" }}>Cochez pour valider ✓</p>
    </div>
  );
}
