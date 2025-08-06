// Firebase SDK import 및 초기화
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJAnuTDddwDMMM48Cx5ZOq-p4wpiVRDAc",
  authDomain: "questionandanswer-4565c.firebaseapp.com",
  projectId: "questionandanswer-4565c",
  storageBucket: "questionandanswer-4565c.firebasestorage.app",
  messagingSenderId: "357060077510",
  appId: "1:357060077510:web:f48ddafd8defaf4a5874c7",
  measurementId: "G-BPW8MWHE42"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
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
    loadSampleData();
    renderQuestions();
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
            renderQuestions(category);
        });
    });
}

// 질문 제출 처리
function handleQuestionSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(questionForm);
    const question = {
        id: Date.now(),
        category: document.getElementById('category').value,
        title: document.getElementById('title').value,
        content: document.getElementById('content').value,
        author: document.getElementById('author').value,
        date: new Date().toLocaleDateString('ko-KR'),
        answers: []
    };
    
    questions.unshift(question); // 최신 질문을 맨 위에 추가
    renderQuestions();
    
    // 폼 초기화 및 모달 닫기
    questionForm.reset();
    questionModal.style.display = 'none';
    
    // 성공 메시지 (선택사항)
    alert('질문이 성공적으로 등록되었습니다!');
}

// 답변 제출 처리
function handleAnswerSubmit(e) {
    e.preventDefault();
    
    const answer = {
        id: Date.now(),
        content: document.getElementById('answerContent').value,
        author: document.getElementById('answerAuthor').value,
        date: new Date().toLocaleDateString('ko-KR')
    };
    
    // 해당 질문에 답변 추가
    const question = questions.find(q => q.id === currentQuestionId);
    if (question) {
        question.answers.push(answer);
        renderQuestions();
    }
    
    // 폼 초기화 및 모달 닫기
    answerForm.reset();
    answerModal.style.display = 'none';
    
    // 성공 메시지
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

// 샘플 데이터 로드
function loadSampleData() {
    questions = [
        {
            id: 1,
            category: 'math',
            title: '이차방정식의 판별식에 대해 질문합니다',
            content: '이차방정식 ax² + bx + c = 0에서 판별식 D = b² - 4ac의 의미를 자세히 설명해주세요.',
            author: '수학학습자',
            date: '2024-01-15',
            answers: [
                {
                    id: 101,
                    content: '판별식 D는 이차방정식의 실근의 개수를 판단하는 도구입니다. D > 0이면 서로 다른 두 실근, D = 0이면 중근, D < 0이면 실근이 없습니다.',
                    author: '수학선생님',
                    date: '2024-01-15'
                }
            ]
        },
        {
            id: 2,
            category: 'english',
            title: '현재완료와 과거시제의 차이점',
            content: 'I have been to London과 I went to London의 차이점을 알고 싶습니다.',
            author: '영어초보',
            date: '2024-01-14',
            answers: []
        },
        {
            id: 3,
            category: 'science',
            title: '광합성 과정에서의 엽록체 역할',
            content: '식물의 광합성 과정에서 엽록체가 하는 구체적인 역할이 무엇인지 궁금합니다.',
            author: '생물학도',
            date: '2024-01-13',
            answers: [
                {
                    id: 301,
                    content: '엽록체는 광합성이 일어나는 세포소기관으로, 엽록소를 포함하여 빛에너지를 화학에너지로 변환하는 역할을 합니다.',
                    author: '과학교사',
                    date: '2024-01-13'
                },
                {
                    id: 302,
                    content: '더 자세히 설명하면, 엽록체 내부의 틸라코이드에서 명반응이, 스트로마에서 암반응이 일어납니다.',
                    author: '생물전공자',
                    date: '2024-01-14'
                }
            ]
        },
        {
            id: 4,
            category: 'korean',
            title: '한글 맞춤법 질문',
            content: '"되"와 "돼"의 사용법을 정확히 알고 싶습니다. 언제 어떤 것을 써야 하나요?',
            author: '맞춤법고민',
            date: '2024-01-12',
            answers: []
        }
    ];
}
