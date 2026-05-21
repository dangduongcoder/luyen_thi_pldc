<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentExam, saveExamResult } from '$lib/store';
  
  let examData: any = $state(null);
  let timerInterval: any;
  let showConfirmSubmit = $state(false);

  onMount(() => {
    currentExam.subscribe(value => {
      if (!value && !examData) {
        goto('/');
      } else if (value && !examData) {
        examData = { ...value }; 
        startTimer();
      }
    });
  });

  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
  });

  function startTimer() {
    timerInterval = setInterval(() => {
      if (examData.timeRemaining > 0) {
        examData.timeRemaining -= 1;
      } else {
        clearInterval(timerInterval);
        submitExam();
      }
    }, 1000);
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function selectAnswer(questionId: number, optionKey: string) {
    if (examData) {
      examData.answers[questionId] = optionKey;
      currentExam.set(examData);
    }
  }

  function submitExam() {
    if (timerInterval) clearInterval(timerInterval);
    
    let correct = 0;
    let wrongIds: number[] = [];
    
    examData.questions.forEach((q: any) => {
      const userAns = examData.answers[q.id];
      if (userAns === q.correct_answer) {
        correct++;
      } else {
        wrongIds.push(q.id);
      }
    });

    const score = Math.round((correct / examData.questions.length) * 10 * 100) / 100;
    
    const result = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      score,
      totalQuestions: examData.questions.length,
      correctAnswers: correct,
      wrongAnswers: examData.questions.length - correct,
      timeSpent: examData.totalTime - examData.timeRemaining,
      wrongQuestionIds: wrongIds,
      type: examData.type,
      questions: examData.questions,
      answers: examData.answers
    };

    saveExamResult(result);
    examData.isFinished = true;
    currentExam.set(examData); 
    
    goto('/result');
  }
  
  function scrollToQuestion(index: number) {
    const el = document.getElementById(`q-${index}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }
</script>

{#if examData}
  <div class="exam-layout">
    <!-- Main Content: Questions -->
    <div class="questions-container">
      <div class="questions-list">
        {#each examData.questions as q, index}
          <div class="card question-card" id={`q-${index}`}>
            <h3 class="question-text">
              <span class="q-num">Câu {index + 1}:</span> {q.question}
            </h3>
            <div class="options-list">
              {#each Object.entries(q.options) as [key, value]}
                <label class="option-item" class:selected={examData.answers[q.id] === key}>
                  <input 
                    type="radio" 
                    name={`q-${q.id}`} 
                    value={key}
                    checked={examData.answers[q.id] === key}
                    on:change={() => selectAnswer(q.id, key)}
                    class="sr-only"
                  >
                  <span class="option-key">{key}</span>
                  <span class="option-text">{value}</span>
                </label>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Sidebar: Quick Navigation -->
    <div class="exam-sidebar">
      <div class="card sidebar-card sticky-sidebar">
        <h3 class="sidebar-title">Danh sách câu hỏi</h3>
        <div class="q-grid">
          {#each examData.questions as q, index}
            <button 
              class="q-nav-btn" 
              class:answered={examData.answers[q.id]}
              on:click={() => scrollToQuestion(index)}
            >
              {index + 1}
            </button>
          {/each}
        </div>
        
        <div class="sidebar-footer">
          <div class="legend mb-6">
            <div class="legend-item"><span class="dot answered"></span> Đã làm</div>
            <div class="legend-item"><span class="dot"></span> Chưa làm</div>
          </div>
          
          <div class="exam-actions">
            <div class="timer-sidebar" class:text-danger={examData.timeRemaining < 300}>
              <span class="timer-icon">⏱️</span> {formatTime(examData.timeRemaining)}
            </div>
            <button class="btn btn-primary w-full submit-btn-large" on:click={() => showConfirmSubmit = true}>
              Nộp bài
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Confirm Modal -->
  {#if showConfirmSubmit}
    <div class="modal-overlay animate-fade-in">
      <div class="card modal-content">
        <h3>Xác nhận nộp bài</h3>
        <p>Bạn có chắc chắn muốn nộp bài? Còn {Object.keys(examData.answers).length}/{examData.questions.length} câu đã làm.</p>
        <div class="modal-actions mt-6">
          <button class="btn btn-outline" on:click={() => showConfirmSubmit = false}>Tiếp tục làm</button>
          <button class="btn btn-primary" on:click={submitExam}>Nộp bài ngay</button>
        </div>
      </div>
    </div>
  {/if}
{/if}

<style>
  .exam-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    position: relative;
  }

  @media (min-width: 1024px) {
    .exam-layout {
      grid-template-columns: 1fr 300px;
    }
  }

  .submit-btn-large {
    font-size: 1.1rem;
    padding: 0.75rem 2rem;
  }

  .timer-sidebar {
    font-size: 1.5rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: var(--primary-color);
    margin-bottom: 1rem;
    padding: 1rem;
    background: var(--primary-light);
    border-radius: var(--radius-md);
  }

  .timer-sidebar.text-danger {
    color: var(--danger-hover);
    background: var(--danger-light);
  }

  .timer-icon {
    font-size: 1.2rem;
  }

  .questions-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .question-card {
    scroll-margin-top: 150px;
  }

  .question-text {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }

  .q-num {
    color: var(--primary-color);
  }

  .options-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .option-item {
    display: flex;
    align-items: flex-start;
    padding: 1rem;
    border: 2px solid var(--border-color);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: var(--transition);
    gap: 1rem;
  }

  .option-item:hover {
    border-color: var(--primary-light);
    background-color: var(--primary-light);
  }

  .option-item.selected {
    border-color: var(--primary-color);
    background-color: rgba(59, 130, 246, 0.05);
  }

  .option-key {
    font-weight: 700;
    color: var(--primary-color);
    background: var(--primary-light);
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
    flex-shrink: 0;
  }

  .option-item.selected .option-key {
    background: var(--primary-color);
    color: white;
  }

  .option-text {
    padding-top: 0.15rem;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .sticky-sidebar {
    position: sticky;
    top: 70px;
    max-height: calc(100vh - 100px);
    overflow-y: auto;
  }

  .sidebar-title {
    font-size: 1.1rem;
    margin-bottom: 1rem;
    text-align: center;
  }

  .q-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.5rem;
  }

  .q-nav-btn {
    width: 100%;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-color);
    background: transparent;
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-main);
  }

  .q-nav-btn:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  .q-nav-btn.answered {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
    color: white;
  }

  .sidebar-footer {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
  }

  .legend {
    display: flex;
    justify-content: center;
    gap: 1rem;
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid var(--border-color);
  }

  .dot.answered {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-content {
    max-width: 400px;
    width: 90%;
    text-align: center;
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }
</style>
