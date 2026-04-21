(function () {
    'use strict';

    var STORE_KEY = 'rb_v4';
    var saveTimer = null;
    var fromPalette = false;
    var paletteType = null;
    var draggingSection = null;

    var dom = {
        paper:       document.getElementById('resume-paper'),
        empty:       document.getElementById('paper-empty'),
        strBar:      document.getElementById('strength-bar'),
        strPct:      document.getElementById('strength-pct'),
        savedPill:   document.getElementById('saved-pill'),
        btnClear:    document.getElementById('btn-clear'),
        btnPdf:      document.getElementById('btn-pdf'),
        fontSel:     document.getElementById('font-sel'),
        spacingRange:document.getElementById('spacing-range'),
        spacingVal:  document.getElementById('spacing-val'),
        toastRail:   document.getElementById('toast-rail')
    };

    var cfg = { template:'modern', color:'slate', font:'Inter', size:'medium', spacing:1.5 };

    function uid() { return '_' + Date.now().toString(36) + Math.random().toString(36).substr(2,5); }
    function eid() { return '_e' + Date.now().toString(36) + Math.random().toString(36).substr(2,4); }

    function makeToolbar() {
        var d = document.createElement('div');
        d.className = 'sec-toolbar';
        d.innerHTML =
            '<button class="stb stb-drag" title="Drag to reorder">\u2807</button>' +
            '<button class="stb stb-up"  title="Move up">\u2191</button>' +
            '<button class="stb stb-dn"  title="Move down">\u2193</button>' +
            '<button class="stb stb-del" title="Remove section">\u00d7</button>';
        return d;
    }

    function buildEntryHTML(data) {
        var id = data.id || eid();
        var bullets = (data.bullets || ['Key achievement or responsibility']).map(function(b) {
            return '<li contenteditable="true" data-ph="Achievement or responsibility...">' + escHtml(b) + '</li>';
        }).join('');
        return '<div class="entry-block" data-eid="' + id + '">' +
                   '<div class="entry-top">' +
                       '<div class="entry-left">' +
                           '<div class="entry-org" contenteditable="true" data-ph="Organization / Company">' + escHtml(data.org || '') + '</div>' +
                           '<div class="entry-role" contenteditable="true" data-ph="Role / Degree / Tech Stack">' + escHtml(data.role || '') + '</div>' +
                       '</div>' +
                       '<div class="entry-right">' +
                           '<div class="entry-date" contenteditable="true" data-ph="Date range">' + escHtml(data.date || '') + '</div>' +
                           '<div class="entry-loc" contenteditable="true" data-ph="Location">' + escHtml(data.location || '') + '</div>' +
                       '</div>' +
                   '</div>' +
                   '<ul class="entry-bullets">' + bullets + '</ul>' +
                   '<div class="entry-actions">' +
                       '<button class="ea-btn ea-bullet" data-eid="' + id + '">+ Bullet</button>' +
                       '<button class="ea-btn ea-del" data-eid="' + id + '">Remove</button>' +
                   '</div>' +
               '</div>';
    }

    function buildSkillCatHTML(name, skills) {
        var tags = (skills || []).map(function(s) {
            return '<span class="skill-tag">' + escHtml(s) + '<button class="skill-tag-x" aria-label="Remove">\u00d7</button></span>';
        }).join('');
        return '<div class="skill-cat-block">' +
                   '<div class="skill-cat-name" contenteditable="true" data-ph="Category name">' + escHtml(name) + '</div>' +
                   '<div class="skill-tags-row">' +
                       tags +
                       '<input type="text" class="skill-tag-input" placeholder="Add skill, Enter to confirm" autocomplete="off">' +
                   '</div>' +
               '</div>';
    }

    function buildCertHTML(data) {
        return '<div class="cert-item">' +
                   '<div>' +
                       '<div class="cert-name" contenteditable="true" data-ph="Certification name">' + escHtml(data.name || '') + '</div>' +
                       '<div class="cert-issuer" contenteditable="true" data-ph="Issuing organization">' + escHtml(data.issuer || '') + '</div>' +
                   '</div>' +
                   '<div class="cert-date" contenteditable="true" data-ph="Year">' + escHtml(data.date || '') + '</div>' +
               '</div>';
    }

    function buildLangHTML(data) {
        return '<div class="lang-item">' +
                   '<div class="lang-name" contenteditable="true" data-ph="Language">' + escHtml(data.name || '') + '</div>' +
                   '<div class="lang-level" contenteditable="true" data-ph="Proficiency level">' + escHtml(data.level || '') + '</div>' +
               '</div>';
    }

    var sectionBuilders = {

        header: function() {
            var id = uid();
            var photoId = 'ph' + id;
            return '<section class="rs-section hdr-section" data-type="header" data-sid="' + id + '">' +
                       '<div class="rs-content">' +
                           '<div class="hdr-wrap">' +
                               '<div class="hdr-photo-zone">' +
                                   '<div class="photo-ring" id="' + photoId + '">' +
                                       '<input type="file" class="photo-input" accept="image/*" data-ring="' + photoId + '">' +
                                       '<span class="photo-hint">Click to<br>add photo</span>' +
                                   '</div>' +
                               '</div>' +
                               '<div class="hdr-info">' +
                                   '<div class="resume-name" contenteditable="true" data-ph="Full Name">Alex Johnson</div>' +
                                   '<div class="resume-jobtitle" contenteditable="true" data-ph="Professional Title">Senior Software Engineer</div>' +
                                   '<div class="resume-contact" contenteditable="true" data-ph="Email \u00b7 Phone \u00b7 Location \u00b7 LinkedIn">alex.johnson@email.com \u00b7 +1 (555) 234-5678 \u00b7 San Francisco, CA \u00b7 linkedin.com/in/alexjohnson</div>' +
                               '</div>' +
                           '</div>' +
                       '</div>' +
                   '</section>';
        },

        summary: function() {
            var id = uid();
            return '<section class="rs-section" data-type="summary" data-sid="' + id + '">' +
                       '<div class="rs-content">' +
                           '<div class="sec-heading" contenteditable="true" data-ph="Section Title">Professional Summary</div>' +
                           '<div class="summary-body" contenteditable="true" data-ph="Write your professional summary here...">Results-driven Software Engineer with 5+ years of experience building scalable web applications and APIs. Expertise in React, Node.js, and AWS. Led cross-functional teams to deliver products serving 2M+ users. Passionate about clean architecture, performance optimization, and mentoring junior developers.</div>' +
                       '</div>' +
                   '</section>';
        },

        experience: function() {
            var id = uid();
            var e1 = buildEntryHTML({ org:'Acme Technologies', role:'Senior Software Engineer', date:'Jan 2021 \u2013 Present', location:'San Francisco, CA', bullets:['Led development of a microservices platform handling 3M daily active users.','Reduced API latency by 38% using Redis caching and query optimization.','Mentored a team of 4 junior engineers on code review best practices.'] });
            var e2 = buildEntryHTML({ org:'Nexus Digital', role:'Software Engineer', date:'Jun 2018 \u2013 Dec 2020', location:'Seattle, WA', bullets:['Built a real-time dashboard with WebSocket integration viewed by 50k users daily.','Migrated legacy monolith to microservices, improving deploy frequency by 4\u00d7.'] });
            return '<section class="rs-section" data-type="experience" data-sid="' + id + '">' +
                       '<div class="rs-content">' +
                           '<div class="sec-heading" contenteditable="true" data-ph="Section Title">Work Experience</div>' +
                           '<div class="entries-body" data-sid="' + id + '">' + e1 + e2 + '</div>' +
                           '<div class="add-entry-row"><button class="add-entry-btn" data-sid="' + id + '" data-etype="experience">+ Add Position</button></div>' +
                       '</div>' +
                   '</section>';
        },

        education: function() {
            var id = uid();
            var e1 = buildEntryHTML({ org:'Massachusetts Institute of Technology', role:'B.S. Computer Science', date:'2014 \u2013 2018', location:'Cambridge, MA', bullets:['GPA: 3.8/4.0 \u00b7 Summa Cum Laude','Relevant: Algorithms, Distributed Systems, Machine Learning, Computer Networks'] });
            return '<section class="rs-section" data-type="education" data-sid="' + id + '">' +
                       '<div class="rs-content">' +
                           '<div class="sec-heading" contenteditable="true" data-ph="Section Title">Education</div>' +
                           '<div class="entries-body" data-sid="' + id + '">' + e1 + '</div>' +
                           '<div class="add-entry-row"><button class="add-entry-btn" data-sid="' + id + '" data-etype="education">+ Add Education</button></div>' +
                       '</div>' +
                   '</section>';
        },

        skills: function() {
            var id = uid();
            var cats = buildSkillCatHTML('Languages', ['JavaScript','TypeScript','Python','Go']) +
                       buildSkillCatHTML('Frameworks', ['React','Node.js','Next.js','Express']) +
                       buildSkillCatHTML('Tools & Cloud', ['Docker','Kubernetes','AWS','PostgreSQL','Redis']);
            return '<section class="rs-section" data-type="skills" data-sid="' + id + '">' +
                       '<div class="rs-content">' +
                           '<div class="sec-heading" contenteditable="true" data-ph="Section Title">Skills</div>' +
                           '<div class="skills-body" data-sid="' + id + '">' + cats + '</div>' +
                           '<button class="add-cat-btn" data-sid="' + id + '">+ Add Category</button>' +
                       '</div>' +
                   '</section>';
        },

        projects: function() {
            var id = uid();
            var e1 = buildEntryHTML({ org:'TaskFlow \u2014 Open Source Project Manager', role:'React \u00b7 Node.js \u00b7 PostgreSQL \u00b7 WebSockets', date:'2023', location:'github.com/alexj/taskflow', bullets:['500+ GitHub stars \u00b7 Built real-time collaboration with conflict resolution.','Optimized PostgreSQL queries via materialized views, cutting load by 60%.'] });
            var e2 = buildEntryHTML({ org:'PriceTrack \u2014 E-commerce Price Monitor', role:'Python \u00b7 Playwright \u00b7 FastAPI \u00b7 Telegram Bot', date:'2022', location:'github.com/alexj/pricetrack', bullets:['Scraped 10k+ product listings daily across 25 e-commerce sites.','Delivered real-time price drop alerts via Telegram to 2,000+ subscribers.'] });
            return '<section class="rs-section" data-type="projects" data-sid="' + id + '">' +
                       '<div class="rs-content">' +
                           '<div class="sec-heading" contenteditable="true" data-ph="Section Title">Projects</div>' +
                           '<div class="entries-body" data-sid="' + id + '">' + e1 + e2 + '</div>' +
                           '<div class="add-entry-row"><button class="add-entry-btn" data-sid="' + id + '" data-etype="projects">+ Add Project</button></div>' +
                       '</div>' +
                   '</section>';
        },

        certifications: function() {
            var id = uid();
            var c1 = buildCertHTML({ name:'AWS Solutions Architect \u2014 Professional', issuer:'Amazon Web Services', date:'2023' });
            var c2 = buildCertHTML({ name:'Google Professional Cloud Developer', issuer:'Google Cloud', date:'2022' });
            var c3 = buildCertHTML({ name:'Certified Kubernetes Administrator (CKA)', issuer:'Cloud Native Computing Foundation', date:'2021' });
            return '<section class="rs-section" data-type="certifications" data-sid="' + id + '">' +
                       '<div class="rs-content">' +
                           '<div class="sec-heading" contenteditable="true" data-ph="Section Title">Certifications</div>' +
                           '<div class="certs-body" data-sid="' + id + '">' + c1 + c2 + c3 + '</div>' +
                           '<div class="add-entry-row"><button class="add-entry-btn" data-sid="' + id + '" data-etype="certifications">+ Add Certification</button></div>' +
                       '</div>' +
                   '</section>';
        },

        languages: function() {
            var id = uid();
            var l1 = buildLangHTML({ name:'English', level:'Native' });
            var l2 = buildLangHTML({ name:'Spanish', level:'Professional' });
            var l3 = buildLangHTML({ name:'French', level:'Intermediate' });
            return '<section class="rs-section" data-type="languages" data-sid="' + id + '">' +
                       '<div class="rs-content">' +
                           '<div class="sec-heading" contenteditable="true" data-ph="Section Title">Languages</div>' +
                           '<div class="lang-grid-body lang-body" data-sid="' + id + '">' + l1 + l2 + l3 + '</div>' +
                           '<div class="add-entry-row"><button class="add-entry-btn" data-sid="' + id + '" data-etype="languages">+ Add Language</button></div>' +
                       '</div>' +
                   '</section>';
        }
    };

    function newEntryDefaults(etype) {
        var m = {
            experience:     { org:'Company Name', role:'Job Title', date:'20XX \u2013 Present', location:'City, State', bullets:['Key achievement or responsibility'] },
            education:      { org:'University Name', role:'Degree, Major', date:'20XX \u2013 20XX', location:'City, State', bullets:['GPA: X.X / 4.0'] },
            projects:       { org:'Project Name', role:'Technologies used', date:'20XX', location:'github.com/...', bullets:['Key feature or outcome'] },
            certifications: null,
            languages:      null
        };
        return m[etype] || m.experience;
    }

    function addSection(type, insertBefore) {
        if (!sectionBuilders[type]) return;
        dom.empty.classList.add('hidden');
        var tmp = document.createElement('div');
        tmp.innerHTML = sectionBuilders[type]();
        var sec = tmp.firstElementChild;
        sec.appendChild(makeToolbar());
        attachSectionDrag(sec);
        if (insertBefore) {
            dom.paper.insertBefore(sec, insertBefore);
        } else {
            dom.paper.insertBefore(sec, dom.empty);
        }
        updateProgress();
        schedSave();
        toast(capitalize(type) + ' section added', 'success');
    }

    function attachSectionDrag(sec) {
        var handle = sec.querySelector('.stb-drag');
        if (!handle) return;
        handle.addEventListener('mousedown', function() {
            sec.setAttribute('draggable', 'true');
        });
        sec.addEventListener('dragstart', function(e) {
            if (fromPalette) { sec.removeAttribute('draggable'); return; }
            draggingSection = sec;
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(function() { sec.classList.add('sec-dragging'); }, 0);
        });
        sec.addEventListener('dragend', function() {
            sec.classList.remove('sec-dragging');
            sec.removeAttribute('draggable');
            draggingSection = null;
            clearDragTargets();
            schedSave();
        });
    }

    function clearDragTargets() {
        dom.paper.querySelectorAll('.sec-drag-target').forEach(function(el) {
            el.classList.remove('sec-drag-target');
        });
    }

    function getInsertTarget(y) {
        var sections = Array.from(dom.paper.querySelectorAll('.rs-section:not(.sec-dragging)'));
        return sections.reduce(function(acc, child) {
            var box = child.getBoundingClientRect();
            var offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > acc.offset) return { offset: offset, el: child };
            return acc;
        }, { offset: -Infinity, el: null }).el;
    }

    dom.paper.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = fromPalette ? 'copy' : 'move';
        dom.paper.classList.add('drop-highlight');
        if (draggingSection) {
            clearDragTargets();
            var target = getInsertTarget(e.clientY);
            if (target) target.classList.add('sec-drag-target');
        }
    });

    dom.paper.addEventListener('dragleave', function(e) {
        if (!dom.paper.contains(e.relatedTarget)) {
            dom.paper.classList.remove('drop-highlight');
            clearDragTargets();
        }
    });

    dom.paper.addEventListener('drop', function(e) {
        e.preventDefault();
        dom.paper.classList.remove('drop-highlight');
        clearDragTargets();
        var insertBefore = getInsertTarget(e.clientY);
        if (fromPalette && paletteType) {
            addSection(paletteType, insertBefore);
        } else if (draggingSection) {
            if (insertBefore) {
                dom.paper.insertBefore(draggingSection, insertBefore);
            } else {
                dom.paper.insertBefore(draggingSection, dom.empty);
            }
            updateProgress();
        }
    });

    document.querySelectorAll('.palette-row').forEach(function(row) {
        row.addEventListener('dragstart', function(e) {
            fromPalette = true;
            paletteType = row.dataset.type;
            row.classList.add('pal-dragging');
            e.dataTransfer.effectAllowed = 'copy';
        });
        row.addEventListener('dragend', function() {
            fromPalette = false;
            paletteType = null;
            row.classList.remove('pal-dragging');
        });
    });

    dom.paper.addEventListener('click', function(e) {
        var t = e.target;

        if (t.classList.contains('stb-del')) {
            var sec = t.closest('.rs-section');
            if (sec) { sec.remove(); checkEmpty(); updateProgress(); schedSave(); toast('Section removed'); }
            return;
        }

        if (t.classList.contains('stb-up')) {
            var sec = t.closest('.rs-section');
            if (sec && sec.previousElementSibling && sec.previousElementSibling.classList.contains('rs-section')) {
                dom.paper.insertBefore(sec, sec.previousElementSibling);
                schedSave();
            }
            return;
        }

        if (t.classList.contains('stb-dn')) {
            var sec = t.closest('.rs-section');
            if (sec) {
                var nxt = sec.nextElementSibling;
                if (nxt && nxt.classList.contains('rs-section')) {
                    dom.paper.insertBefore(nxt, sec);
                    schedSave();
                }
            }
            return;
        }

        if (t.classList.contains('add-entry-btn')) {
            handleAddEntry(t.dataset.sid, t.dataset.etype);
            schedSave();
            return;
        }

        if (t.classList.contains('ea-del')) {
            var block = dom.paper.querySelector('.entry-block[data-eid="' + t.dataset.eid + '"]');
            if (block) { block.remove(); schedSave(); }
            return;
        }

        if (t.classList.contains('ea-bullet')) {
            var block = dom.paper.querySelector('.entry-block[data-eid="' + t.dataset.eid + '"]');
            if (block) {
                var ul = block.querySelector('.entry-bullets');
                var li = document.createElement('li');
                li.contentEditable = 'true';
                li.dataset.ph = 'Achievement or responsibility...';
                ul.appendChild(li);
                li.focus();
                schedSave();
            }
            return;
        }

        if (t.classList.contains('skill-tag-x')) {
            t.closest('.skill-tag').remove();
            schedSave();
            return;
        }

        if (t.classList.contains('add-cat-btn')) {
            var body = dom.paper.querySelector('.skills-body[data-sid="' + t.dataset.sid + '"]');
            if (body) {
                var tmp = document.createElement('div');
                tmp.innerHTML = buildSkillCatHTML('Category', []);
                var cat = tmp.firstElementChild;
                body.appendChild(cat);
                cat.querySelector('.skill-cat-name').focus();
                schedSave();
            }
            return;
        }
    });

    dom.paper.addEventListener('keydown', function(e) {
        if (e.target.classList.contains('skill-tag-input') && (e.key === 'Enter' || e.key === ',')) {
            e.preventDefault();
            var v = e.target.value.replace(/,/g, '').trim();
            if (v) {
                var tag = document.createElement('span');
                tag.className = 'skill-tag';
                tag.innerHTML = escHtml(v) + '<button class="skill-tag-x" aria-label="Remove">\u00d7</button>';
                e.target.parentNode.insertBefore(tag, e.target);
                e.target.value = '';
                schedSave();
            }
            return;
        }

        if (e.target.tagName === 'LI' && e.target.closest('.entry-bullets')) {
            if (e.key === 'Enter') {
                e.preventDefault();
                var li = document.createElement('li');
                li.contentEditable = 'true';
                li.dataset.ph = 'Achievement or responsibility...';
                var nxt = e.target.nextSibling;
                e.target.parentNode.insertBefore(li, nxt);
                li.focus();
            } else if (e.key === 'Backspace' && e.target.textContent === '') {
                e.preventDefault();
                var prev = e.target.previousElementSibling;
                var ul = e.target.parentNode;
                if (ul.children.length > 1) {
                    e.target.remove();
                    if (prev) moveCursorToEnd(prev);
                }
            }
        }
    });

    dom.paper.addEventListener('input', function() {
        updateProgress();
        schedSave();
    });

    dom.paper.addEventListener('change', function(e) {
        if (e.target.classList.contains('photo-input')) {
            var file = e.target.files[0];
            if (!file) return;
            var ring = document.getElementById(e.target.dataset.ring);
            if (!ring) return;
            var reader = new FileReader();
            reader.onload = function(ev) {
                ring.innerHTML = '<img src="' + ev.target.result + '" alt="Profile photo"><input type="file" class="photo-input" accept="image/*" data-ring="' + ring.id + '">';
                schedSave();
            };
            reader.readAsDataURL(file);
        }
    });

    function handleAddEntry(sid, etype) {
        if (etype === 'certifications') {
            var body = dom.paper.querySelector('.certs-body[data-sid="' + sid + '"]');
            if (body) {
                var tmp = document.createElement('div');
                tmp.innerHTML = buildCertHTML({ name:'Certification Name', issuer:'Issuing Organization', date:'202X' });
                body.appendChild(tmp.firstElementChild);
            }
            return;
        }
        if (etype === 'languages') {
            var body = dom.paper.querySelector('.lang-body[data-sid="' + sid + '"]');
            if (body) {
                var tmp = document.createElement('div');
                tmp.innerHTML = buildLangHTML({ name:'Language', level:'Proficiency Level' });
                body.appendChild(tmp.firstElementChild);
            }
            return;
        }
        var container = dom.paper.querySelector('.entries-body[data-sid="' + sid + '"]');
        if (!container) return;
        var defaults = newEntryDefaults(etype);
        var tmp = document.createElement('div');
        tmp.innerHTML = buildEntryHTML(defaults);
        var block = tmp.firstElementChild;
        container.appendChild(block);
        var first = block.querySelector('[contenteditable]');
        if (first) first.focus();
    }

    document.querySelectorAll('.tmpl-card').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tmpl-card').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            cfg.template = btn.dataset.template;
            dom.paper.dataset.template = cfg.template;
            schedSave();
        });
    });

    document.querySelectorAll('.color-swatch').forEach(function(sw) {
        sw.addEventListener('click', function() {
            document.querySelectorAll('.color-swatch').forEach(function(s) { s.classList.remove('active'); });
            sw.classList.add('active');
            cfg.color = sw.dataset.color;
            document.body.dataset.color = cfg.color;
            schedSave();
        });
    });

    dom.fontSel.addEventListener('change', function() {
        cfg.font = dom.fontSel.value;
        dom.paper.style.fontFamily = '"' + cfg.font + '", sans-serif';
        schedSave();
    });

    document.querySelectorAll('.size-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.size-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            cfg.size = btn.dataset.fs;
            var map = { small:'0.875rem', medium:'1rem', large:'1.07rem' };
            dom.paper.style.fontSize = map[cfg.size] || '1rem';
            schedSave();
        });
    });

    dom.spacingRange.addEventListener('input', function() {
        var v = parseFloat(dom.spacingRange.value);
        cfg.spacing = v;
        dom.paper.style.lineHeight = v;
        dom.spacingVal.textContent = v.toFixed(1) + '\u00d7';
        schedSave();
    });

    dom.btnClear.addEventListener('click', function() {
        if (!confirm('Clear all sections and start fresh?')) return;
        dom.paper.querySelectorAll('.rs-section').forEach(function(s) { s.remove(); });
        checkEmpty();
        updateProgress();
        localStorage.removeItem(STORE_KEY);
        toast('Document cleared');
    });

    dom.btnPdf.addEventListener('click', function() { window.print(); });

    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); window.print(); }
    });

    function updateProgress() {
        var types = {};
        dom.paper.querySelectorAll('.rs-section').forEach(function(s) { types[s.dataset.type] = true; });
        var score = 0;
        if (types.header)         score += 25;
        if (types.summary)        score += 15;
        if (types.experience)     score += 30;
        if (types.education)      score += 15;
        if (types.skills)         score += 10;
        if (types.projects || types.certifications || types.languages) score += 5;
        score = Math.min(score, 100);
        dom.strBar.style.width = score + '%';
        dom.strPct.textContent = score + '%';
    }

    function checkEmpty() {
        var count = dom.paper.querySelectorAll('.rs-section').length;
        if (count === 0) dom.empty.classList.remove('hidden');
        else             dom.empty.classList.add('hidden');
    }

    function schedSave() {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(doSave, 900);
    }

    function doSave() {
        var sections = [];
        dom.paper.querySelectorAll('.rs-section').forEach(function(sec) {
            var clone = sec.cloneNode(true);
            var tb = clone.querySelector('.sec-toolbar');
            if (tb) tb.remove();
            clone.removeAttribute('draggable');
            sections.push({ type: sec.dataset.type, html: clone.outerHTML });
        });
        var payload = { cfg: cfg, sections: sections };
        try {
            localStorage.setItem(STORE_KEY, JSON.stringify(payload));
            dom.savedPill.classList.add('show');
            setTimeout(function() { dom.savedPill.classList.remove('show'); }, 1800);
        } catch (err) {
            toast('Storage quota exceeded. Image may be too large.', 'error');
        }
    }

    function doLoad() {
        try {
            var raw = localStorage.getItem(STORE_KEY);
            if (!raw) return;
            var payload = JSON.parse(raw);

            if (payload.cfg) {
                var c = payload.cfg;
                cfg.template = c.template || 'modern';
                cfg.color    = c.color    || 'slate';
                cfg.font     = c.font     || 'Inter';
                cfg.size     = c.size     || 'medium';
                cfg.spacing  = c.spacing  || 1.5;

                dom.paper.dataset.template = cfg.template;
                document.body.dataset.color = cfg.color;
                dom.paper.style.fontFamily = '"' + cfg.font + '", sans-serif';
                var sizeMap = { small:'0.875rem', medium:'1rem', large:'1.07rem' };
                dom.paper.style.fontSize = sizeMap[cfg.size] || '1rem';
                dom.paper.style.lineHeight = cfg.spacing;
                dom.spacingRange.value = cfg.spacing;
                dom.spacingVal.textContent = parseFloat(cfg.spacing).toFixed(1) + '\u00d7';
                dom.fontSel.value = cfg.font;

                document.querySelectorAll('.tmpl-card').forEach(function(b) { b.classList.toggle('active', b.dataset.template === cfg.template); });
                document.querySelectorAll('.color-swatch').forEach(function(s) { s.classList.toggle('active', s.dataset.color === cfg.color); });
                document.querySelectorAll('.size-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.fs === cfg.size); });
            }

            if (payload.sections && payload.sections.length) {
                dom.empty.classList.add('hidden');
                payload.sections.forEach(function(data) {
                    var tmp = document.createElement('div');
                    tmp.innerHTML = data.html;
                    var sec = tmp.firstElementChild;
                    if (!sec) return;
                    sec.appendChild(makeToolbar());
                    attachSectionDrag(sec);
                    dom.paper.insertBefore(sec, dom.empty);
                });
            }
            updateProgress();
        } catch (err) {}
    }

    function toast(msg, type) {
        var el = document.createElement('div');
        el.className = 'toast-item' + (type ? ' t-' + type : '');
        el.textContent = msg;
        dom.toastRail.appendChild(el);
        setTimeout(function() {
            el.classList.add('fade-out');
            el.addEventListener('animationend', function() { el.remove(); }, { once: true });
        }, 2600);
    }

    function moveCursorToEnd(el) {
        var range = document.createRange();
        var sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    function escHtml(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    doLoad();

}());
