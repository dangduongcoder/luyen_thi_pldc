<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { examHistory, currentExam, getAllWrongQuestionIds } from "$lib/store";
  import type { ExamResult } from "$lib/store";
  import { api } from "$lib/api";

  let totalExams = $state(0);
  let avgScore = $state(0);
  let wrongQuestionsCount = $state(0);
  let chartData: { height: number; score: number; label: string }[] = $state(
    [],
  );
  let historyList: ExamResult[] = $state([]);

  // Form configuration
  let examType: "full" | "quick" | "retry" | "custom" = $state("full");
  let questionCount = $state(40);
  let timeLimit = $state(60); // minutes

  let isLoading = $state(false);

  $effect(() => {
    if (examType === "full") {
      questionCount = 40;
      timeLimit = 60;
    } else if (examType === "quick") {
      questionCount = 10;
      timeLimit = 15;
    } else if (examType === "retry") {
      questionCount = wrongQuestionsCount;
      timeLimit = Math.ceil(wrongQuestionsCount * 1.5);
    }
  });

  onMount(() => {
    examHistory.subscribe((history) => {
      totalExams = history.length;
      if (totalExams > 0) {
        const sum = history.reduce((acc, curr) => acc + (curr.score || 0), 0);
        avgScore = Math.round((sum / totalExams) * 10) / 10;
      }

      wrongQuestionsCount = getAllWrongQuestionIds().length;
      historyList = history;

      const recent = [...history].reverse().slice(-5);
      chartData = recent.map((item, index) => ({
        height: (item.score / 10) * 100,
        score: item.score,
        label: `#${index + 1}`,
      }));
    });
  });

  function formatDate(isoString: string) {
    const date = new Date(isoString);
    return (
      date.toLocaleDateString("vi-VN") +
      " " +
      date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    );
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}p ${s}s`;
  }

  function getExamTypeName(type: string) {
    switch (type) {
      case "full":
        return "Đầy đủ";
      case "quick":
        return "Nhanh";
      case "retry":
        return "Làm lại";
      default:
        return type;
    }
  }

  function viewDetails(item: ExamResult) {
    if (item.questions && item.answers) {
      currentExam.set({
        questions: item.questions,
        answers: item.answers,
        timeRemaining: item.totalQuestions * 60 - item.timeSpent,
        totalTime: item.totalQuestions * 60,
        isFinished: true,
        type: item.type,
      });
      goto("/result");
    } else {
      alert(
        "Rất tiếc, bài làm này được lưu trữ theo cấu trúc cũ nên không có chi tiết đáp án.",
      );
    }
  }

  async function startExam() {
    isLoading = true;
    try {
      let questions = [];
      if (examType === "retry") {
        const wrongIds = getAllWrongQuestionIds();
        questions = await api.getQuestionsByIds(wrongIds);
      } else {
        questions = await api.getQuestions(questionCount);
      }

      currentExam.set({
        questions,
        answers: {},
        timeRemaining: timeLimit * 60,
        totalTime: timeLimit * 60,
        isFinished: false,
        type: examType === "custom" ? "full" : examType,
      });

      goto("/exam");
    } catch (error) {
      console.error("Failed to load questions", error);
      alert("Đã có lỗi xảy ra khi tải câu hỏi.");
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="dashboard-layout">
  <!-- Stats & Progress Row -->
  <div class="stats-progress-container animate-fade-in">
    <div class="stats-grid">
      <div class="card stat-card bg-primary-gradient">
        <h3>Tổng bài đã làm</h3>
        <div class="stat-value">{totalExams}</div>
        <p>bài kiểm tra</p>
      </div>

      <div class="card stat-card bg-secondary-gradient">
        <h3>Điểm trung bình</h3>
        <div class="stat-value">{avgScore}/10</div>
        <p>tổng số bài</p>
      </div>

      <div class="card stat-card bg-warning-gradient">
        <h3>Câu sai cần làm lại</h3>
        <div class="stat-value">{wrongQuestionsCount}</div>
        <p>câu hỏi</p>
      </div>
    </div>

    {#if chartData.length > 0}
      <div class="card p-6 chart-card">
        <h3 class="chart-title">Tiến độ 5 bài thi gần nhất</h3>
        <div class="chart-container-mini">
          <div class="bars-area-mini">
            {#each chartData as data}
              <div class="bar-wrapper-mini">
                <div class="bar-value-mini">{data.score}</div>
                <div
                  class="bar-fill-mini"
                  style="height: {data.height}%;"
                ></div>
                <div class="bar-label-mini">{data.label}</div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Setup Section -->
  <div class="setup-container animate-fade-in" style="animation-delay: 0.1s;">
    <div class="card config-card">
      <h2 class="mb-6">Bắt đầu ôn luyện</h2>

      <div class="form-group">
        <label>Chế độ thi</label>
        <div class="mode-selector">
          <label class="mode-option" class:active={examType === "full"}>
            <input
              type="radio"
              bind:group={examType}
              value="full"
              class="sr-only"
            />
            <span class="mode-title">Đầy đủ</span>
            <span class="mode-desc">40 câu / 60 phút</span>
          </label>
          <label class="mode-option" class:active={examType === "quick"}>
            <input
              type="radio"
              bind:group={examType}
              value="quick"
              class="sr-only"
            />
            <span class="mode-title">Luyện nhanh</span>
            <span class="mode-desc">10 câu / 15 phút</span>
          </label>
          <label
            class="mode-option"
            class:active={examType === "retry"}
            class:disabled={wrongQuestionsCount === 0}
          >
            <input
              type="radio"
              bind:group={examType}
              value="retry"
              class="sr-only"
              disabled={wrongQuestionsCount === 0}
            />
            <span class="mode-title">Làm lại câu sai</span>
            <span class="mode-desc">{wrongQuestionsCount} câu</span>
          </label>
          <label class="mode-option" class:active={examType === "custom"}>
            <input
              type="radio"
              bind:group={examType}
              value="custom"
              class="sr-only"
            />
            <span class="mode-title">Tùy chỉnh</span>
            <span class="mode-desc">Tự chọn</span>
          </label>
        </div>
      </div>

      {#if examType === "custom"}
        <div class="custom-config animate-fade-in">
          <div class="form-group">
            <label for="q-count">Số lượng câu hỏi</label>
            <input
              type="number"
              id="q-count"
              bind:value={questionCount}
              min="5"
              max="100"
              class="input-field"
            />
          </div>
          <div class="form-group">
            <label for="t-limit">Thời gian (phút)</label>
            <input
              type="number"
              id="t-limit"
              bind:value={timeLimit}
              min="5"
              max="120"
              class="input-field"
            />
          </div>
        </div>
      {/if}

      <button
        class="btn btn-primary w-full start-btn mt-8"
        on:click={startExam}
        disabled={isLoading ||
          (examType === "retry" && wrongQuestionsCount === 0)}
      >
        {#if isLoading}
          Đang tải...
        {:else}
          <span class="text-lg">Bắt đầu thi ngay</span>
        {/if}
      </button>
    </div>
  </div>
</div>

{#if historyList.length > 0}
  <div class="card p-0 overflow-hidden mt-8 animate-fade-in">
    <h3 class="p-6 border-b">Lịch sử các bài thi</h3>
    <div class="table-responsive">
      <table class="history-table">
        <thead>
          <tr>
            <th>Ngày thi</th>
            <th>Chế độ</th>
            <th>Điểm</th>
            <th>Đúng/Sai</th>
            <th>Thời gian</th>
          </tr>
        </thead>
        <tbody>
          {#each historyList as item}
            <tr class="clickable-row" on:click={() => viewDetails(item)}>
              <td>{formatDate(item.date)}</td>
              <td><span class="badge">{getExamTypeName(item.type)}</span></td>
              <td>
                <span
                  class="score-badge"
                  class:high-score={item.score >= 8}
                  class:low-score={item.score < 5}
                >
                  {item.score}
                </span>
              </td>
              <td>
                <span class="text-success">{item.correctAnswers}</span> /
                <span class="text-danger">{item.wrongAnswers}</span>
              </td>
              <td>{formatTime(item.timeSpent)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}

<style>
  .dashboard-layout {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .stats-progress-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  @media (min-width: 1024px) {
    .stats-progress-container {
      flex-direction: row;
    }
  }

  .stats-grid {
    flex: 3;
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 768px) {
    .stats-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .chart-card {
    flex: 2;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .stat-card {
    color: white;
    padding: 1.5rem;
    border: none;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .stat-card h3 {
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: rgba(255, 255, 255, 0.9);
  }

  .stat-value {
    font-size: 2.5rem;
    font-weight: 800;
    line-height: 1;
    margin-bottom: 0.5rem;
  }

  .bg-primary-gradient {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
  }

  .bg-secondary-gradient {
    background: linear-gradient(135deg, #10b981, #059669);
  }

  .bg-warning-gradient {
    background: linear-gradient(135deg, #f59e0b, #d97706);
  }

  .config-card {
    padding: 2rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: var(--text-main);
  }

  .mode-selector {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .mode-option {
    border: 2px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 1rem;
    cursor: pointer;
    transition: var(--transition);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .mode-option:hover:not(.disabled) {
    border-color: var(--primary-light);
    background-color: var(--primary-light);
  }

  .mode-option.active {
    border-color: var(--primary-color);
    background-color: var(--primary-light);
  }

  .mode-option.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .mode-title {
    font-weight: 700;
    color: var(--text-main);
  }

  .mode-option.active .mode-title {
    color: var(--primary-color);
  }

  .mode-desc {
    font-size: 0.85rem;
    color: var(--text-muted);
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

  .custom-config {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    background: var(--background-color);
    padding: 1.5rem;
    border-radius: var(--radius-md);
    border: 1px dashed var(--border-color);
  }

  .input-field {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    font-family: var(--font-family);
    font-size: 1rem;
    outline: none;
    transition: var(--transition);
  }

  .input-field:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .start-btn {
    padding: 1rem;
    font-size: 1.1rem;
  }

  .start-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* Mini Chart Styles */
  .p-6 {
    padding: 1.5rem;
  }

  .chart-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-muted);
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .chart-container-mini {
    display: flex;
    flex: 1;
    min-height: 120px;
    padding-bottom: 1rem;
  }

  .bars-area-mini {
    flex: 1;
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
    padding-bottom: 25px;
    position: relative;
    border-bottom: 1px solid var(--border-color);
  }

  .bar-wrapper-mini {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    position: relative;
    width: 30px;
  }

  .bar-fill-mini {
    width: 100%;
    background: linear-gradient(
      to top,
      var(--primary-color),
      var(--primary-light)
    );
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    transition: height 0.5s ease-out;
  }

  .bar-wrapper-mini:hover .bar-fill-mini {
    background: linear-gradient(
      to top,
      var(--secondary-color),
      var(--secondary-light)
    );
  }

  .bar-value-mini {
    font-size: 0.75rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
    color: var(--text-main);
  }

  .bar-label-mini {
    position: absolute;
    bottom: -22px;
    font-size: 0.7rem;
    color: var(--text-muted);
    white-space: nowrap;
  }

  /* Table Styles */
  .p-6 {
    padding: 1.5rem;
  }
  .p-0 {
    padding: 0;
  }
  .border-b {
    border-bottom: 1px solid var(--border-color);
  }

  .overflow-hidden {
    overflow: hidden;
  }

  .table-responsive {
    overflow-x: auto;
  }

  .history-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .history-table th,
  .history-table td {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .history-table th {
    background-color: var(--background-color);
    font-weight: 600;
    color: var(--text-muted);
  }

  .clickable-row {
    cursor: pointer;
    transition: var(--transition);
  }

  .clickable-row:hover {
    background-color: var(--primary-light);
  }

  .history-table tbody tr:last-child td {
    border-bottom: none;
  }

  .badge {
    background: var(--background-color);
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-full);
    font-size: 0.85rem;
    font-weight: 500;
    border: 1px solid var(--border-color);
  }

  .score-badge {
    font-weight: 700;
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-sm);
  }

  .high-score {
    color: var(--secondary-hover);
    background-color: var(--secondary-light);
  }

  .low-score {
    color: var(--danger-hover);
    background-color: var(--danger-light);
  }
</style>
