<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentExam, examHistory } from '$lib/store';

  let resultData: any = $state(null);
  let finalScore = $state(0);
  let correctCount = $state(0);
  let totalCount = $state(0);
  let timeSpent = $state(0);
  let copiedId: number | null = $state(null);

  onMount(() => {
    const unsubscribe = currentExam.subscribe(value => {
      if (!value || !value.isFinished) {
        goto('/');
      } else {
        resultData = value;
        totalCount = resultData.questions.length;
        
        // Calculate again just for display or get from history (simpler to recalculate here)
        resultData.questions.forEach((q: any) => {
          if (resultData.answers[q.id] === q.correct_answer) {
            correctCount++;
          }
        });
        finalScore = Math.round((correctCount / totalCount) * 10 * 100) / 100;
        timeSpent = resultData.totalTime - resultData.timeRemaining;
      }
    });
    return unsubscribe;
  });

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} phút ${s} giây`;
  }

  function goHome() {
    currentExam.set(null);
    goto('/');
  }

  function getStatusClass(qId: number, optionKey: string, correctAns: string) {
    const userAns = resultData.answers[qId];
    if (optionKey === correctAns) return 'correct-ans';
    if (userAns === optionKey && optionKey !== correctAns) return 'wrong-ans';
    return '';
  }

  async function copyPrompt(q: any) {
    let optionsText = '';
    Object.entries(q.options).forEach(([key, value]) => {
      optionsText += `${key}. ${value}\n`;
    });

    const prompt = `Hãy giải câu hỏi trắc nghiệm sau và phân tích đầy đủ:

[CÂU HỎI]
${q.question}
${optionsText}
Yêu cầu:
1. Chọn đáp án đúng.
2. Giải thích vì sao đáp án đó đúng.
3. Phân tích và so sánh với từng đáp án còn lại để chỉ ra điểm khác nhau.
4. Nêu dấu hiệu nhận biết nhanh/mẹo phân biệt các đáp án.
5. Áp dụng đúng với pháp luật Việt Nam

Định dạng mong muốn:

- Đáp án đúng: ...
- Giải thích:
...
- So sánh các đáp án:
| Đáp án | Ý nghĩa | Dấu hiệu nhận biết | Ví dụ |
|---|---|---|---|

- Mẹo làm nhanh:
...`;

    try {
      await navigator.clipboard.writeText(prompt);
      copiedId = q.id;
      setTimeout(() => { copiedId = null; }, 2000);
    } catch (err) {
      console.error('Failed to copy', err);
      alert('Không thể copy, vui lòng thử lại.');
    }
  }
</script>

{#if resultData}
  <div class="result-container animate-fade-in">
    <div class="card result-summary">
      <h2 class="text-center mb-6">Kết quả bài thi</h2>
      
      <div class="score-circle-container">
        <div class="score-circle">
          <div class="score-value">
            <span class="score-num text-primary">{finalScore}</span>
            <span class="score-max">/10</span>
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Số câu đúng</span>
          <span class="stat-value text-success">{correctCount}/{totalCount}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Thời gian làm bài</span>
          <span class="stat-value">{formatTime(timeSpent)}</span>
        </div>
      </div>

      <div class="mt-8 text-center">
        <button class="btn btn-primary" on:click={goHome}>Về trang chủ</button>
      </div>
    </div>

    <div class="details-section mt-8">
      <h3 class="mb-4">Chi tiết đáp án</h3>
      <div class="questions-list">
        {#each resultData.questions as q, index}
          <div class="card question-card" id={`q-${index}`}>
            <div class="question-header">
              <h4 class="question-text">
                <span class="q-num">Câu {index + 1}:</span> {q.question}
              </h4>
              <div class="tooltip-container">
                <button class="ai-prompt-btn" on:click={() => copyPrompt(q)}>
                  {#if copiedId === q.id}
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-success"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-warning"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>
                  {/if}
                </button>
                <span class="tooltip-text">Copy prompt để hỏi AI</span>
              </div>
            </div>
            
            {#if !resultData.answers[q.id]}
              <div class="badge badge-warning mb-4">Chưa chọn đáp án</div>
            {:else if resultData.answers[q.id] === q.correct_answer}
              <div class="badge badge-success mb-4">Làm đúng</div>
            {:else}
              <div class="badge badge-danger mb-4">Làm sai</div>
            {/if}

            <div class="options-list">
              {#each Object.entries(q.options) as [key, value]}
                <div class="option-item {getStatusClass(q.id, key, q.correct_answer)}">
                  <span class="option-key">{key}</span>
                  <span class="option-text">{value}</span>
                  
                  {#if getStatusClass(q.id, key, q.correct_answer) === 'correct-ans'}
                    <span class="status-icon">✓</span>
                  {:else if getStatusClass(q.id, key, q.correct_answer) === 'wrong-ans'}
                    <span class="status-icon">✕</span>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .result-container {
    max-width: 800px;
    margin: 0 auto;
  }

  .result-summary {
    padding: 3rem 2rem;
  }

  .score-circle-container {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .score-circle {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: conic-gradient(var(--primary-color) calc(var(--score-pct) * 1%), var(--border-color) 0);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    border: 10px solid var(--primary-light);
    box-shadow: var(--shadow-lg);
  }

  .score-value {
    background: white;
    width: 160px;
    height: 160px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    box-shadow: inset var(--shadow-sm);
  }

  .score-num {
    font-size: 3.5rem;
    font-weight: 800;
    line-height: 1;
  }

  .score-max {
    font-size: 1.2rem;
    color: var(--text-muted);
    font-weight: 600;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    background: var(--background-color);
    padding: 1.5rem;
    border-radius: var(--radius-lg);
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .stat-label {
    font-size: 0.9rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
  }

  .questions-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .question-card {
    padding: 1.5rem;
  }

  .question-text {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .q-num {
    color: var(--primary-color);
  }

  .badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-full);
    font-size: 0.85rem;
    font-weight: 600;
  }

  .badge-success { background: var(--secondary-light); color: var(--secondary-hover); }
  .badge-danger { background: var(--danger-light); color: var(--danger-hover); }
  .badge-warning { background: var(--warning-light); color: var(--warning-hover); }

  .options-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .option-item {
    display: flex;
    align-items: flex-start;
    padding: 1rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--background-color);
    position: relative;
    padding-right: 3rem; /* Space for icon */
  }

  .option-key {
    font-weight: 700;
    width: 30px;
    flex-shrink: 0;
  }

  .status-icon {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    font-weight: 800;
    font-size: 1.2rem;
  }

  .correct-ans {
    background-color: var(--secondary-light);
    border-color: var(--secondary-color);
    color: var(--secondary-hover);
  }

  .wrong-ans {
    background-color: var(--danger-light);
    border-color: var(--danger-color);
    color: var(--danger-hover);
  }

  .question-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .question-header .question-text {
    margin-bottom: 0;
    flex: 1;
  }

  .ai-prompt-btn {
    background: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-full);
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    transition: var(--transition);
    flex-shrink: 0;
  }

  .ai-prompt-btn:hover {
    background: var(--warning-light);
    border-color: var(--warning-color);
    color: var(--warning-color);
  }

  /* Tooltip styling */
  .tooltip-container {
    position: relative;
    display: inline-block;
  }

  .tooltip-text {
    visibility: hidden;
    width: 150px;
    background-color: var(--text-main);
    color: #fff;
    text-align: center;
    border-radius: var(--radius-sm);
    padding: 0.5rem;
    position: absolute;
    z-index: 1;
    bottom: 125%; 
    left: 50%;
    margin-left: -75px; 
    opacity: 0;
    transition: opacity 0.3s;
    font-size: 0.75rem;
    pointer-events: none;
  }

  .tooltip-text::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: var(--text-main) transparent transparent transparent;
  }

  .tooltip-container:hover .tooltip-text {
    visibility: visible;
    opacity: 1;
  }
</style>
