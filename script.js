// Firebase SDK 모듈 import
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

// Firebase 설정 및 초기화
const firebaseConfig = {
  apiKey: "AIzaSyCJAnuTDddwDMMM48Cx5ZOq-p4wpiVRDAc",
  authDomain: "questionandanswer-4565c.firebaseapp.com",
  projectId: "questionandanswer-4565c",
  storageBucket: "questionandanswer-4565c.firebasestorage.app",
  messagingSenderId: "357060077510",
  appId: "1:357060077510:web:f48ddafd8defaf4a5874c7",
  measurementId: "G-BPW8MWHE42"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// 전역 변수
let questions = [];
let currentQuestionId = null;

// 과목별 한글 이름 매핑
const categoryNames = {
    'korean': '국어',
    'english': '영어',
    'math': '수학',
    'social': '사회',
    'science': '과학',
    'engineering': '공학'
};

// DOM 요소들
const writeBtn = document.getElementById('writeBtn');
const questionModal = document.getElementById('questionModal');
const answerModal = document.getElementById('answerModal');
const questionForm = document.getElementById('questionForm');
const answerForm = document.getElementById('answerForm');
const questionList = document.getElementById('questionList');
const categoryBtns = document.querySelectorAll('.category-btn');

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    loadQuestionsFromDB();
    setupEventListeners();
});

// 이벤트 리스너 설정
function setupEventListeners() {
    // 질문하기 버튼
    writeBtn.addEventListener('click', () => {
        questionModal.style.display = 'block';
    });

    // 모달 닫기 버튼들
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });

    // 모달 외부 클릭시 닫기
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // 질문 폼 제출
    questionForm.addEventListener('submit', handleQuestionSubmit);

    // 답변 폼 제출
    answerForm.addEventListener('submit', handleAnswerSubmit);

    // 카테고리 필터 버튼들
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 활성 버튼 변경
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // 질문 필터링
            const category = btn.dataset.category;
            loadQuestionsFromDB(category);
        });
    });
}

// 질문 제출 처리
async function handleQuestionSubmit(e) {
    e.preventDefault();
    const question = {
        category: document.getElementById('category').value,
        title: document.getElementById('title').value,
        content: document.getElementById('content').value,
        author: document.getElementById('author').value,
        date: new Date().toLocaleDateString('ko-KR'),
        answers: []
    };
    await addDoc(collection(db, "questions"), question);
    await loadQuestionsFromDB();
    questionForm.reset();
    questionModal.style.display = 'none';
    alert('질문이 성공적으로 등록되었습니다!');
}

// 답변 제출 처리
async function handleAnswerSubmit(e) {
    e.preventDefault();
    const answer = {
        content: document.getElementById('answerContent').value,
        author: document.getElementById('answerAuthor').value,
        date: new Date().toLocaleDateString('ko-KR')
    };
    const questionRef = doc(db, "questions", currentQuestionId);
    // Firestore의 answers 배열에 답변 추가
    await updateDoc(questionRef, {
        answers: arrayUnion(answer)
    });
    await loadQuestionsFromDB();
    answerForm.reset();
    answerModal.style.display = 'none';
    alert('답변이 성공적으로 등록되었습니다!');
}

// 질문 목록 렌더링
function renderQuestions(filterCategory = 'all') {
    let filteredQuestions = questions;
    
    // 카테고리 필터링
    if (filterCategory !== 'all') {
        filteredQuestions = questions.filter(q => q.category === filterCategory);
    }
    
    if (filteredQuestions.length === 0) {
        questionList.innerHTML = `
            <div class="empty-state">
                <h3>등록된 질문이 없습니다</h3>
                <p>첫 번째 질문을 등록해보세요!</p>
            </div>
        `;
        return;
    }
    
    questionList.innerHTML = filteredQuestions.map(question => `
        <div class="question-card">
            <div class="question-header">
                <div>
                    <h3 class="question-title">${question.title}</h3>
                    <div class="question-meta">
                        <span class="category-tag">${categoryNames[question.category]}</span>
                        <span>작성자: ${question.author}</span>
                        <span>작성일: ${question.date}</span>
                    </div>
                </div>
            </div>
            <div class="question-content">${question.content}</div>
            <div class="question-actions">
                <button class="answer-btn" onclick="openAnswerModal(${question.id})">
                    답변하기
                </button>
                <span class="answer-count">
                    답변 ${question.answers.length}개
                </span>
            </div>
            ${question.answers.length > 0 ? `
                <div class="answers-section">
                    <h4>답변</h4>
                    ${question.answers.map(answer => `
                        <div class="answer-item">
                            <div class="answer-meta">
                                <strong>${answer.author}</strong> • ${answer.date}
                            </div>
                            <div class="answer-content">${answer.content}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// 답변 모달 열기
function openAnswerModal(questionId) {
    currentQuestionId = questionId;
    answerModal.style.display = 'block';
}

// Firestore 기반이므로 샘플 데이터 함수는 제거합니다.