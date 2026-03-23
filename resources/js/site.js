let timerInterval;
        let timerActive   = false;
        let currentTimer  = 'study';
        let cyclesCompleted = 0;

        const defaultTimes = { study: 25 * 60, break: 5 * 60, longbreak: 15 * 60 };
        let timeLeft = { ...defaultTimes };

        function startTimer(type) {
            if (timerActive && currentTimer === type) return;
            pauseTimer();
            currentTimer = type;
            timerActive  = true;

            document.querySelectorAll('.timer-card').forEach(c => c.classList.remove('active'));
            document.getElementById(`${type}-timer`).classList.add('active');

            timerInterval = setInterval(() => {
                if (timeLeft[type] > 0) {
                    timeLeft[type]--;
                    updateTimerDisplay(type);
                } else {
                    completeTimer(type);
                }
            }, 1000);
        }

        function pauseTimer() {
            clearInterval(timerInterval);
            timerActive = false;
        }

        function resetTimer() {
            pauseTimer();
            timeLeft = { ...defaultTimes };
            ['study', 'break', 'longbreak'].forEach(updateTimerDisplay);
        }

        function updateTimerDisplay(type) {
            const m = Math.floor(timeLeft[type] / 60).toString().padStart(2, '0');
            const s = (timeLeft[type] % 60).toString().padStart(2, '0');
            document.getElementById(`${type}-display`).textContent = `${m}:${s}`;
        }

        function completeTimer(type) {
            pauseTimer();
            if (type === 'study') {
                cyclesCompleted++;
                document.getElementById('cycles-count').textContent = cyclesCompleted;
                progress.studyHours += 25 / 60;
                showNotification(
                    cyclesCompleted % 4 === 0 ? '🎉 Parabéns!' : '✅ Ciclo completo!',
                    cyclesCompleted % 4 === 0 ? '4 ciclos completos! Hora da pausa longa!' : 'Hora de uma pausa curta!'
                );
            } else {
                showNotification('⏰ Pausa finalizada!', 'Hora de voltar aos estudos!');
            }
            timeLeft[type] = defaultTimes[type];
            updateTimerDisplay(type);
            saveProgress();
            updateStats();
        }

        // ── Progresso ───────────────────────────────────────────────────────────
        let progress = {
            currentWeek: 1, completedTasks: 0, totalProjects: 0,
            daysStudied: 0, studyHours: 0, checkedItems: [], completedSlots: []
        };

        function loadProgress() {
            const saved = localStorage.getItem('devProgress6months');
            if (saved) {
                progress = JSON.parse(saved);
                updateStats();
                loadCheckedItems();
                loadCompletedSlots();
            }
        }

        function saveProgress() {
            localStorage.setItem('devProgress6months', JSON.stringify(progress));
        }

        function updateStats() {
            document.getElementById('currentWeek').textContent   = progress.currentWeek;
            document.getElementById('completedTasks').textContent = progress.completedTasks;
            document.getElementById('totalProjects').textContent  = progress.totalProjects;
            document.getElementById('daysStudied').textContent    = progress.daysStudied;
            document.getElementById('studyHours').textContent     = Math.round(progress.studyHours);

            const pct = Math.min(100, Math.round((progress.currentWeek / 24) * 100));
            const fill = document.getElementById('progressFill');
            fill.style.width   = pct + '%';
            fill.textContent   = pct + '%';
        }

        function resetProgress() {
            if (!confirm('Tem certeza que deseja resetar todo o progresso?')) return;
            localStorage.removeItem('devProgress6months');
            progress = { currentWeek:1, completedTasks:0, totalProjects:0, daysStudied:0, studyHours:0, checkedItems:[], completedSlots:[] };
            cyclesCompleted = 0;
            document.getElementById('cycles-count').textContent = '0';
            updateStats();
            document.querySelectorAll('.checklist-item input').forEach(cb => {
                cb.checked = false;
                cb.parentElement.classList.remove('completed');
            });
            document.querySelectorAll('.check-btn').forEach(btn => {
                btn.classList.remove('completed');
                btn.textContent = '✓ Concluir';
            });
        }

        // ── Slots ──────────────────────────────────────────────────────────────
        // FIX: função corrigida — antes só slot-1 tinha ID; slots 2-10 causavam getElementById = null → crash
        function completeSlot(slotId) {
            const slot = document.getElementById(slotId);
            if (!slot) return;
            const btn = slot.querySelector('.check-btn');
            if (btn.classList.contains('completed')) return;

            btn.classList.add('completed');
            btn.textContent = '✓ Concluído';
            if (!progress.completedSlots.includes(slotId)) {
                progress.completedSlots.push(slotId);
                progress.completedTasks++;
            }
            saveProgress();
            updateStats();
            showNotification('✅ Atividade concluída!', 'Continue assim!');
        }

        function loadCompletedSlots() {
            progress.completedSlots.forEach(slotId => {
                const slot = document.getElementById(slotId);
                if (!slot) return;
                const btn = slot.querySelector('.check-btn');
                btn.classList.add('completed');
                btn.textContent = '✓ Concluído';
            });
        }

        // ── Day ────────────────────────────────────────────────────────────────
        function markDayStudied() {
            progress.daysStudied++;
            progress.studyHours += 3;
            if (progress.daysStudied % 5 === 0) progress.currentWeek++;
            progress.completedSlots = [];
            document.querySelectorAll('.check-btn').forEach(btn => {
                btn.classList.remove('completed');
                btn.textContent = '✓ Concluir';
            });
            cyclesCompleted = 0;
            document.getElementById('cycles-count').textContent = '0';
            updateStats();
            saveProgress();
            showNotification('🎉 Dia concluído!', `Você já estudou ${progress.daysStudied} dias!`);
        }

        // ── Checklist ──────────────────────────────────────────────────────────
        function toggleCheck(element) {
            const checkbox = element.querySelector('input[type="checkbox"]');
            checkbox.checked = !checkbox.checked;
            element.classList.toggle('completed', checkbox.checked);
            const text = element.querySelector('span').textContent;
            if (checkbox.checked) {
                if (!progress.checkedItems.includes(text)) {
                    progress.checkedItems.push(text);
                    progress.completedTasks++;
                }
            } else {
                progress.checkedItems = progress.checkedItems.filter(i => i !== text);
                progress.completedTasks = Math.max(0, progress.completedTasks - 1);
            }
            updateStats();
            saveProgress();
        }

        function loadCheckedItems() {
            document.querySelectorAll('.checklist-item').forEach(item => {
                if (progress.checkedItems.includes(item.querySelector('span').textContent)) {
                    item.querySelector('input').checked = true;
                    item.classList.add('completed');
                }
            });
        }

        // ── Tabs ───────────────────────────────────────────────────────────────
        // FIX: event agora é parâmetro explícito, não variável global implícita
        function showSection(sectionId, event) {
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');
            if (event && event.target) event.target.classList.add('active');
        }

        // ── Notification ───────────────────────────────────────────────────────
        let notifTimeout;
        function showNotification(title, message) {
            clearTimeout(notifTimeout);
            document.getElementById('notif-title').textContent   = title;
            document.getElementById('notif-message').textContent = message;
            const notif = document.getElementById('notification');
            notif.classList.add('show');
            notifTimeout = setTimeout(() => notif.classList.remove('show'), 3000);
        }

        // ── Google Calendar ────────────────────────────────────────────────────
        function addToGoogleCalendar(type) {
            const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
            const details = encodeURIComponent(
                'Cronograma:\n17:00-17:25 Teoria\n17:30-17:55 Prática\n18:00-18:25 Exercícios\n18:30-18:55 Projeto\n19:10-19:50 Revisão'
            );
            const today = getTodayDate();
            let extra = '';
            if (type === 'daily') {
                extra = `&text=Estudos+Dev+Web&dates=${today}T170000/${today}T200000&details=${details}&recur=RRULE:FREQ=DAILY;COUNT=180`;
            } else if (type === 'week') {
                extra = `&text=Estudos+Dev+Web+-+Semana&dates=${today}T170000/${getOffsetDate(7)}T200000&details=${details}`;
            } else {
                extra = `&text=Estudos+Dev+Web+-+Mês&dates=${today}T170000/${getOffsetDate(30)}T200000&details=${details}`;
            }
            window.open(base + extra, '_blank');
        }

        function getTodayDate() {
            return new Date().toISOString().split('T')[0].replace(/-/g, '');
        }

        function getOffsetDate(days) {
            const d = new Date();
            d.setDate(d.getDate() + days);
            return d.toISOString().split('T')[0].replace(/-/g, '');
        }

        // ── Current time highlight ─────────────────────────────────────────────
        // FIX: variável `slot` era usada fora do escopo correto (ReferenceError)
        function checkCurrentTime() {
            const now  = new Date();
            const curr = now.getHours() * 60 + now.getMinutes();
            document.querySelectorAll('.time-slot').forEach(slotEl => {
                slotEl.classList.remove('current');
                const timeEl = slotEl.querySelector('.time');
                if (!timeEl) return;
                const start = timeEl.textContent.split(' - ')[0];
                const [h, m] = start.split(':').map(Number);
                const slotStart = h * 60 + m;
                const end = timeEl.textContent.split(' - ')[1];
                const [h2, m2] = end.split(':').map(Number);
                const slotEnd = h2 * 60 + m2;
                if (curr >= slotStart && curr < slotEnd) slotEl.classList.add('current');
            });
        }

        // ── Init ───────────────────────────────────────────────────────────────
        document.addEventListener('DOMContentLoaded', () => {
            loadProgress();
            ['study', 'break', 'longbreak'].forEach(updateTimerDisplay);
            checkCurrentTime();
            setInterval(checkCurrentTime, 60_000);
        });