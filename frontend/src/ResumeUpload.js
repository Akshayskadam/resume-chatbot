
import { useState, useEffect } from "react";
import "./ResumeUpload.css";

function ResumeUpload() {
const [file, setFile] = useState(null);
const [resumeText, setResumeText] = useState("");
const [correctedText, setCorrectedText] = useState("");
const [issuesCount, setIssuesCount] = useState(0);
const [highlightIssues, setHighlightIssues] = useState([]);
const [candidateLevel, setCandidateLevel] = useState("");
const [atsScore, setAtsScore] = useState(0);
const [missingSections, setMissingSections] = useState([]);
const [aiSuggestions, setAiSuggestions] = useState("");
const [chatQuestion, setChatQuestion] = useState("");
const [chatReply, setChatReply] = useState("");
const [status, setStatus] = useState("");
const [isAnalyzing, setIsAnalyzing] = useState(false);
const [isChatLoading, setIsChatLoading] = useState(false);
const [showDisclaimer, setShowDisclaimer] = useState(true);
const [atsFactors, setAtsFactors] = useState({});
const [selectedTemplate, setSelectedTemplate] = useState("classic");


/* ================================
SCROLL REVEAL EFFECT
================================ */
useEffect(() => {
const reveals = document.querySelectorAll(".card");

const observer = new IntersectionObserver(
entries => {
entries.forEach(entry => {
if (entry.isIntersecting) {
entry.target.classList.add("active");
}
});
},
{ threshold: 0.15 }
);

reveals.forEach(el => {
el.classList.add("reveal");
observer.observe(el);
});

return () => observer.disconnect();
}, []);
/* ================================
DISCLAIMER SCREEN
================================ */
if (showDisclaimer) {
return (
<div className="container">
<div className="card" style={{ textAlign: "center" }}>
<h2 className="section-title">Important Disclaimer</h2>

<p style={{ lineHeight: "1.8", fontSize: "15px", marginTop: "15px" }}>
Your resume details are <b>not stored</b>, <b>not shared</b>, and
<b> never misused</b> on this website.
This platform is designed only to help you analyze, rebuild,
and improve your resume quality, ATS compatibility, and professional
content.
You may also ask the AI chatbot for better suggestions and improvements
related to your resume.
</p>

<button
style={{ marginTop: "25px" }}
onClick={() => setShowDisclaimer(false)}
>
I Understand & Continue
</button>
</div>
</div>
);
}

/* ================================
UPLOAD & ANALYZE RESUME
================================ */
const uploadResume = async () => {
if (!file) {
alert("Please select a resume");
return;
}

setIsAnalyzing(true);
setStatus("Analyzing resume...");

const formData = new FormData();
formData.append("file", file);

try {
const res = await fetch("http://127.0.0.1:8000/analyze-resume", {
method: "POST",
body: formData
});

const data = await res.json();
setAtsFactors(data.ats_factors || {});

setResumeText(data.original_text || "");
setCorrectedText(data.corrected_text || "");
setIssuesCount(data.issues_found || 0);
setHighlightIssues(data.highlight_issues || []);
setCandidateLevel(data.candidate_level || "");
setAtsScore(data.ats_score || 0);
setMissingSections(data.missing_sections || []);
setAiSuggestions(data.ai_suggestions || "");
setStatus("Analysis complete ✅");
} catch (err) {
console.error(err);
setStatus("Error analyzing resume ❌");
} finally {
setIsAnalyzing(false);
}
};

/* ================================
HIGHLIGHT ISSUES
================================ */
const highlightText = (text, issues) => {
  if (!issues || issues.length === 0) return text;

  const sorted = [...issues].sort((a, b) => a.start - b.start);
  let result = [];
  let lastIndex = 0;

  sorted.forEach((issue, i) => {
    const start = issue.start;
    const end = start + issue.length;

    if (start > lastIndex) {
      result.push(text.slice(lastIndex, start));
    }

    result.push(
      <span
        key={i}
        className="resume-highlight"
        title={`${issue.message}\nSuggestions: ${issue.suggestions?.join(", ")}`}
      >
        {text.slice(start, end)}
      </span>
    );

    lastIndex = end;
  });

  result.push(text.slice(lastIndex));
  return result;
};

/* ================================
RESUME CHATBOT
================================ */
const askChatbot = async () => {
if (!chatQuestion.trim()) return;

setIsChatLoading(true);
setChatReply("");

try {
const res = await fetch("http://127.0.0.1:8000/resume-chat", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
question: chatQuestion,
resume_text: resumeText,
candidate_level: candidateLevel
})
});

const data = await res.json();
setChatReply(data.reply || "No response received");
} catch (err) {
console.error(err);
setChatReply("Something went wrong ❌");
} finally {
setIsChatLoading(false);
}
};

/* ================================
DOWNLOAD PDF
================================ */
const downloadCorrectedPDF = async () => {
  if (!file) {
    alert("Please select a resume first");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("template", selectedTemplate); // ✅ NEW

  try {
    const res = await fetch("http://127.0.0.1:8000/export-corrected-pdf", {
      method: "POST",
      body: formData
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `corrected_resume_${selectedTemplate}.pdf`;
    a.click();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("Failed to download PDF ❌");
  }
};


/* ================================
UI
================================ */
return (
<div className="container">
<h2 className="title">Smart Resume Analyzer</h2>


{/* Upload */}
<div className="card">
<div className="upload-box">
<input
type="file"
accept=".pdf"
onChange={e => setFile(e.target.files[0])}
/>
<button onClick={uploadResume} disabled={isAnalyzing}>
{isAnalyzing ? (
<>
<span className="spinner"></span> Analyzing...
</>
) : (
"Upload & Analyze"
)}
</button>
</div>
<p className="status">{status}</p>
</div>

{/* Candidate Level */}
{candidateLevel && (
<div className="card">
<h3 className="section-title">Candidate Level</h3>
<span className="badge green">{candidateLevel}</span>
</div>
)}

{/* ATS Score */}
{atsScore > 0 && (
<div className="card ats-card">
<h3 className="section-title">ATS Resume Score</h3>
<div className="ats-score">{atsScore} / 100</div>

<table className="ats-table">
<thead>
<tr>
<th>Factor</th>
<th>Weight</th>
</tr>
</thead>
<tbody>
{Object.entries(atsFactors).map(([factor, weight], i) => (
<tr key={i}>
<td>{factor}</td>
<td>{weight}</td>
</tr>
))}
</tbody>
</table>

</div>
)}


{/* Missing Sections */}
{missingSections.length > 0 && (
<div className="card">
<h3 className="section-title">Missing Resume Sections</h3>
<ul className="missing-list">
{missingSections.map((sec, i) => (
<li key={i}>❌ {sec}</li>
))}
</ul>
</div>
)}

{/* Extracted Resume */}
{resumeText && (
  <div className="card">
    <h3 className="section-title">
      Extracted Resume (Issues Highlighted)
    </h3>

    <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
      🔍 Issues Found: {issuesCount}
    </p>

    <div className="text-box">
      {highlightText(resumeText, highlightIssues)}
    </div>
  </div>
)}


<div class="card upcoming-feature">

  <div class="upcoming-overlay">
    <div class="upcoming-badge">
      🚧 Upcoming Feature
    </div>
  </div>

  <h3 class="section-title">Resume Template & Export</h3>
  <p>
    Resume templates and PDF export are currently under maintenance.
    This feature will be available soon.
  </p>

  <div class="template-grid">
    <div class="template-card">Classic</div>
    <div class="template-card">Modern</div>
    <div class="template-card">Professional</div>
    <div class="template-card">Minimal</div>
  </div>

  <button class="download-btn">
    Download Corrected Resume PDF
  </button>

</div>




{/* AI Suggestions */}
{aiSuggestions && (
<div className="card">
<h3 className="section-title">AI Resume Suggestions</h3>
<textarea rows="12" value={aiSuggestions} readOnly />
</div>
)}

{/* Chatbot */}
<div className="card">
<h3 className="section-title">Resume Chatbot 🤖</h3>
<div className="chat-box">
<input
type="text"
placeholder="Ask: Improve my skills section"
value={chatQuestion}
onChange={e => setChatQuestion(e.target.value)}
/>
<button onClick={askChatbot} disabled={isChatLoading}>
{isChatLoading ? "Thinking..." : "Ask"}
</button>
</div>

{chatReply && (
<div className="text-box" style={{ marginTop: "15px" }}>
<b>AI Reply:</b>
<p>{chatReply}</p>
</div>
)}
</div>
</div>
);
}

export default ResumeUpload;