// script.js

// Firebase SDK import
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, onSnapshot, addDoc, updateDoc, doc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// 전역 변수
let questions = []; // Firestore에서 불러온 질문 데이터를 저장할 배열
let currentQuestionId = null; // 현재 선택된 질문의 ID

// Firebase 인스턴스
let db;
let auth;
let userId;
let appId;

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
const loadingSpinner = document.getElementById('loadingSpinner');

// 초기화
document.addEventListener('DOMContentLoaded', async function() {
    // Firebase 설정 및 앱 ID 가져오기
    // __firebase_config와 __app_id는 Canvas 환경에서 자동으로 제공되는 전역 변수입니다.
    // 로컬 환경에서 테스트할 경우, 직접 Firebase 설정 객체를 여기에 넣거나,
    // 제공된 API 키를 사용하여 firebaseConfig 객체를 구성해야 합니다.
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
        apiKey: "AIzaSyCJAnuTDddwDMMM48Cx5ZOq-p4wpiVRDAc",
        authDomain: "questionandanswer-4565c.firebaseapp.com",
        projectId: "questionandanswer-4565c",
        storageBucket: "questionandanswer-4565c.firebasestorage.app",
        messagingSenderId: "357060077510",
        appId: "1:357060077510:web:f48ddafd8defaf4a5874c7",
        measurementId: "G-BPW8MWHE42"
    };
    appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    // Firebase 앱 초기화
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    // 사용자 인증 (커스텀 토큰 또는 익명 인증)
    try {
        if (typeof __initial_auth_token !== 'undefined') {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
    } catch (error) {
        console.error("Firebase 인증 오류:", error);
        showMessage("인증에 실패했습니다. 다시 시도해주세요.");
    }

    // 인증 상태 변경 리스너 설정
    onAuthStateChanged(auth, (user) => {
        if (user) {
            userId = user.uid;
            console.log("사용자 인증됨:", userId);
            // 사용자 인증 후 질문 실시간 리스너 설정
            setupRealtimeQuestionsListener();
        } else {
            userId = crypto.randomUUID(); // 인증되지 않은 경우 임시 ID 사용
            console.log("사용자 인증되지 않음, 익명 ID 사용:", userId);
            setupRealtimeQuestionsListener(); // 익명 사용자도 공개 데이터 로드
        }
        setupEventListeners();
    });
});

// 로딩 스피너 표시
function showLoading() {
    loadingSpinner.style.display = 'flex';
}

// 로딩 스피너 숨기기
function hideLoading() {
    loadingSpinner.style.display = 'none';
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 질문하기 버튼
    writeBtn.addEventListener('click', () => {
        questionForm.reset(); // 폼 초기화
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

// 질문 실시간 리스너 설정
function setupRealtimeQuestionsListener() {
    showLoading();
    // Firestore 컬렉션 참조 (공개 데이터 경로)
    const questionsColRef = collection(db, `artifacts/${appId}/public/data/questions`);
    
    // onSnapshot을 사용하여 실시간으로 데이터 변경 감지
    onSnapshot(questionsColRef, (snapshot) => {
        questions = snapshot.docs.map(doc => ({
            id: doc.id, // Firestore 문서 ID를 질문 ID로 사용
            ...doc.data()
        }));
        // 최신 질문이 맨 위에 오도록 timestamp 필드를 사용하여 시간순으로 정렬
        questions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        // 현재 활성화된 카테고리에 따라 질문 목록 다시 렌더링
        const activeCategoryBtn = document.querySelector('.category-btn.active');
        const currentFilterCategory = activeCategoryBtn ? activeCategoryBtn.dataset.category : 'all';
        renderQuestions(currentFilterCategory);
        hideLoading();
    }, (error) => {
        console.error("질문 불러오기 오류:", error);
        showMessage("질문 목록을 불러오는 데 실패했습니다.");
        hideLoading();
    });
}

// 질문 제출 처리
async function handleQuestionSubmit(e) {
    e.preventDefault();
    showLoading();
    
    const newQuestion = {
        category: document.getElementById('category').value,
        title: document.getElementById('title').value,
        content: document.getElementById('content').value,
        author: document.getElementById('author').value,
        date: new Date().toLocaleDateString('ko-KR'),
        timestamp: Date.now(), // 정렬을 위한 타임스탬프
        answers: [],
        authorId: userId // 작성자 ID 저장
    };
    
    try {
        // Firestore에 새 문서 추가
        const docRef = await addDoc(collection(db, `artifacts/${appId}/public/data/questions`), newQuestion);
        console.log("문서 ID:", docRef.id);
        showMessage('질문이 성공적으로 등록되었습니다!');
        // onSnapshot 리스너가 자동으로 UI를 업데이트하므로 questions 배열을 수동으로 업데이트할 필요 없음
    } catch (error) {
        console.error("문서 추가 오류:", error);
        showMessage('질문 등록에 실패했습니다.');
    } finally {
        questionForm.reset();
        questionModal.style.display = 'none';
        hideLoading();
    }
}

// 답변 제출 처리
async function handleAnswerSubmit(e) {
    e.preventDefault();
    showLoading();
    
    const newAnswer = {
        id: Date.now(), // 답변 고유 ID (배열 내에서)
        content: document.getElementById('answerContent').value,
        author: document.getElementById('answerAuthor').value,
        date: new Date().toLocaleDateString('ko-KR'),
        timestamp: Date.now(), // 답변 정렬을 위한 타임스탬프
        authorId: userId // 답변자 ID 저장
    };
    
    try {
        // 해당 질문 문서에 답변 추가 (arrayUnion 사용)
        const questionRef = doc(db, `artifacts/${appId}/public/data/questions`, currentQuestionId);
        await updateDoc(questionRef, {
            answers: arrayUnion(newAnswer)
        });
        showMessage('답변이 성공적으로 등록되었습니다!');
        // onSnapshot 리스너가 자동으로 UI를 업데이트하므로 questions 배열을 수동으로 업데이트할 필요 없음
    } catch (error) {
        console.error("답변 추가 오류:", error);
        showMessage('답변 등록에 실패했습니다.');
    } finally {
        answerForm.reset();
        answerModal.style.display = 'none';
        hideLoading();
    }
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
                <!-- onclick 대신 data-question-id 속성을 사용하고 JavaScript에서 이벤트 리스너를 추가합니다. -->
                <button class="answer-btn" data-question-id="${question.id}">
                    답변하기
                </button>
                <span class="answer-count">
                    답변 ${question.answers ? question.answers.length : 0}개
                </span>
            </div>
            ${question.answers && question.answers.length > 0 ? `
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

    // 새로 렌더링된 버튼에 이벤트 리스너 추가
    document.querySelectorAll('.answer-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const questionId = event.target.dataset.questionId;
            openAnswerModal(questionId);
        });
    });
}

// 답변 모달 열기
// 이 함수는 이제 HTML의 onclick에서 직접 호출되지 않으므로 window 객체에 할당할 필요가 없습니다.
function openAnswerModal(questionId) {
    currentQuestionId = questionId;
    answerForm.reset(); // 폼 초기화
    answerModal.style.display = 'block';
}

// 커스텀 메시지 박스 (alert 대체)
function showMessage(message) {
    const messageBox = document.createElement('div');
    messageBox.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #4CAF50;
        color: white;
        padding: 15px 30px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 2000;
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
        font-size: 1.1em;
    `;
    messageBox.textContent = message;
    document.body.appendChild(messageBox);

    setTimeout(() => {
        messageBox.style.opacity = 1;
    }, 10); // 약간의 지연 후 나타나게 함

    setTimeout(() => {
        messageBox.style.opacity = 0;
        messageBox.addEventListener('transitionend', () => messageBox.remove());
    }, 2000); // 2초 후 사라짐
}
