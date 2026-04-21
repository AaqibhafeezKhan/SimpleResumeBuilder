const documentStore = {
    content: []
};

const domElements = {
    sheet: document.getElementById('resume-document'),
    prompt: document.getElementById('drop-prompt'),
    draggables: document.querySelectorAll('.drag-item'),
    clearBtn: document.getElementById('btn-clear'),
    printBtn: document.getElementById('btn-print'),
    colorBtns: document.querySelectorAll('.color-btn'),
    fontSelect: document.getElementById('font-family'),
    body: document.body
};

const sectionGenerators = {
    header: () => `
        <div class="resume-header">
            <h1 contenteditable="true">John Doe</h1>
            <div class="title" contenteditable="true">Senior Software Engineer</div>
            <div class="contact-info" contenteditable="true">
                <span>john.doe@example.com</span> |
                <span>+1 234 567 890</span> |
                <span>New York, NY</span> |
                <span>linkedin.com/in/johndoe</span>
            </div>
        </div>
    `,
    summary: () => `
        <div class="section-title" contenteditable="true">Professional Summary</div>
        <div contenteditable="true" style="color: var(--text-secondary); line-height: 1.6;">
            Dedicated and results-driven professional with over 5 years of experience in developing scalable web applications. Proven ability to optimize application performance and lead cross-functional teams to deliver high-quality software solutions on time.
        </div>
    `,
    experience: () => `
        <div class="section-title" contenteditable="true">Experience</div>
        <div class="item-wrapper">
            <div class="item-header">
                <div class="item-title" contenteditable="true">Tech Solutions Inc.</div>
                <div class="item-date" contenteditable="true">Jan 2020 - Present</div>
            </div>
            <div class="item-subtitle" contenteditable="true">Senior Software Engineer</div>
            <ul class="item-body" contenteditable="true">
                <li>Spearheaded the migration to a microservices architecture, improving system scalability by 40%.</li>
                <li>Mentored junior developers, establishing an internal codebase standard.</li>
            </ul>
        </div>
    `,
    education: () => `
        <div class="section-title" contenteditable="true">Education</div>
        <div class="item-wrapper">
            <div class="item-header">
                <div class="item-title" contenteditable="true">University of Technology</div>
                <div class="item-date" contenteditable="true">2016 - 2020</div>
            </div>
            <div class="item-subtitle" contenteditable="true">Bachelor of Science in Computer Science</div>
            <div style="color: var(--text-secondary);" contenteditable="true">Graduated with Honors, GPA: 3.8/4.0</div>
        </div>
    `,
    skills: () => `
        <div class="section-title" contenteditable="true">Skills</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
                <strong contenteditable="true">Programming:</strong>
                <div contenteditable="true" style="color: var(--text-secondary);">JavaScript, TypeScript, Python, Java</div>
            </div>
            <div>
                <strong contenteditable="true">Frameworks:</strong>
                <div contenteditable="true" style="color: var(--text-secondary);">React, Node.js, Express, Next.js</div>
            </div>
            <div>
                <strong contenteditable="true">Tools:</strong>
                <div contenteditable="true" style="color: var(--text-secondary);">Git, Docker, AWS, Webpack</div>
            </div>
        </div>
    `,
    projects: () => `
        <div class="section-title" contenteditable="true">Projects</div>
        <div class="item-wrapper">
            <div class="item-header">
                <div class="item-title" contenteditable="true">E-Commerce Platform Redesign</div>
                <div class="item-date" contenteditable="true">2023</div>
            </div>
            <div class="item-subtitle" contenteditable="true">Lead Developer</div>
            <ul class="item-body" contenteditable="true">
                <li>Redesigned the entire frontend and backend infrastructure, handling over 100k active users daily.</li>
                <li>Integrated multiple payment gateways and optimized query performance by 30%.</li>
            </ul>
        </div>
    `
};

let draggedItemObj = null;

domElements.draggables.forEach(item => {
    item.addEventListener('dragstart', (e) => {
        item.classList.add('dragging');
        e.dataTransfer.setData('text/plain', item.dataset.type);
    });

    item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
    });
});

domElements.sheet.addEventListener('dragover', e => {
    e.preventDefault();
    domElements.sheet.classList.add('drop-active');
    
    if (draggedItemObj) {
        const afterElement = getDragAfterElement(domElements.sheet, e.clientY);
        if (afterElement == null) {
            domElements.sheet.appendChild(draggedItemObj);
        } else {
            domElements.sheet.insertBefore(draggedItemObj, afterElement);
        }
    }
});

domElements.sheet.addEventListener('dragleave', e => {
    if (!domElements.sheet.contains(e.relatedTarget)) {
        domElements.sheet.classList.remove('drop-active');
    }
});

domElements.sheet.addEventListener('drop', e => {
    e.preventDefault();
    domElements.sheet.classList.remove('drop-active');
    
    const type = e.dataTransfer.getData('text/plain');
    if (type && sectionGenerators[type] && !draggedItemObj) {
        domElements.prompt.classList.add('hidden');
        renderSection(type);
        saveState();
    }
});

function createActionButtons() {
    const div = document.createElement('div');
    div.className = 'section-actions';
    div.setAttribute('contenteditable', 'false');
    
    const upBtn = document.createElement('button');
    upBtn.className = 'action-btn';
    upBtn.innerHTML = '↑';
    upBtn.onclick = function() {
        const blk = this.closest('.section-block');
        if (blk.previousElementSibling && blk.previousElementSibling.id !== 'drop-prompt') {
            blk.parentNode.insertBefore(blk, blk.previousElementSibling);
            saveState();
        }
    };

    const downBtn = document.createElement('button');
    downBtn.className = 'action-btn';
    downBtn.innerHTML = '↓';
    downBtn.onclick = function() {
        const blk = this.closest('.section-block');
        if (blk.nextElementSibling) {
            blk.parentNode.insertBefore(blk.nextElementSibling, blk);
            saveState();
        }
    };

    const delBtn = document.createElement('button');
    delBtn.className = 'action-btn delete';
    delBtn.innerHTML = '✕';
    delBtn.onclick = function() {
        this.closest('.section-block').remove();
        checkPrompt();
        saveState();
    };

    div.appendChild(upBtn);
    div.appendChild(downBtn);
    div.appendChild(delBtn);
    return div;
}

function renderSection(type, internalHtml = null) {
    const block = document.createElement('div');
    block.className = 'section-block';
    block.setAttribute('draggable', 'true');
    block.dataset.type = type;

    block.innerHTML = internalHtml || sectionGenerators[type]();
    block.appendChild(createActionButtons());

    block.addEventListener('dragstart', () => {
        draggedItemObj = block;
        setTimeout(() => block.classList.add('dragging'), 0);
    });

    block.addEventListener('dragend', () => {
        block.classList.remove('dragging');
        draggedItemObj = null;
        saveState();
    });

    block.addEventListener('input', debounce(saveState, 1000));

    if (!internalHtml) {
        const afterElement = getDragAfterElement(domElements.sheet, event ? window.event.clientY : 0);
        if (afterElement == null) {
            domElements.sheet.appendChild(block);
        } else {
            domElements.sheet.insertBefore(block, afterElement);
        }
    } else {
        domElements.sheet.appendChild(block);
    }
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.section-block:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function checkPrompt() {
    const blocks = domElements.sheet.querySelectorAll('.section-block');
    if (blocks.length === 0) {
        domElements.prompt.classList.remove('hidden');
    } else {
        domElements.prompt.classList.add('hidden');
    }
}

domElements.colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        domElements.colorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const color = btn.dataset.color;
        domElements.body.dataset.color = color;
        localStorage.setItem('resume-theme-color', color);
    });
});

domElements.fontSelect.addEventListener('change', (e) => {
    const font = e.target.value;
    domElements.body.style.setProperty('--font-family', `"${font}", sans-serif`);
    localStorage.setItem('resume-font', font);
});

domElements.clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the entire document?')) {
        domElements.sheet.querySelectorAll('.section-block').forEach(el => el.remove());
        checkPrompt();
        localStorage.removeItem('resume-data');
    }
});

domElements.printBtn.addEventListener('click', () => {
    window.print();
});

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function saveState() {
    const blocks = [];
    domElements.sheet.querySelectorAll('.section-block').forEach(block => {
        const clone = block.cloneNode(true);
        const actions = clone.querySelector('.section-actions');
        if (actions) actions.remove();
        
        blocks.push({
            type: block.dataset.type,
            html: clone.innerHTML
        });
    });
    localStorage.setItem('resume-data', JSON.stringify(blocks));
}

function loadState() {
    const savedData = localStorage.getItem('resume-data');
    if (savedData) {
        try {
            const blocks = JSON.parse(savedData);
            if (blocks.length > 0) {
                domElements.prompt.classList.add('hidden');
                blocks.forEach(block => {
                    renderSection(block.type, block.html);
                });
            }
        } catch(e) {}
    }

    const savedColor = localStorage.getItem('resume-theme-color');
    if (savedColor) {
        const btn = document.querySelector(`.color-btn[data-color="${savedColor}"]`);
        if (btn) btn.click();
    }

    const savedFont = localStorage.getItem('resume-font');
    if (savedFont) {
        domElements.fontSelect.value = savedFont;
        domElements.fontSelect.dispatchEvent(new Event('change'));
    }
}

document.addEventListener('DOMContentLoaded', loadState);
