"""
LIG DNA DOTO APP - Database Layer (PostgreSQL / Supabase)
"""
import os
from datetime import datetime, date
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL')

def get_connection():
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    return conn

def init_db():
    """데이터베이스 테이블 생성 및 초기 샘플 데이터 적재"""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS todos (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                category TEXT NOT NULL DEFAULT '업무자동화',
                priority TEXT NOT NULL DEFAULT '보통',
                status TEXT NOT NULL DEFAULT 'pending',
                due_date TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        conn.commit()

        # 데이터가 없을 경우 LIG DNA 실무 맞춤형 샘플 데이터 자동 생성
        cursor.execute("SELECT COUNT(*) AS cnt FROM todos")
        count = cursor.fetchone()['cnt']
        if count == 0:
            insert_sample_data(cursor)
            conn.commit()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS kpis (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                category TEXT NOT NULL DEFAULT '업무자동화',
                unit TEXT NOT NULL DEFAULT '건',
                target_value NUMERIC NOT NULL DEFAULT 0,
                actual_value NUMERIC NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        conn.commit()

        cursor.execute("SELECT COUNT(*) AS cnt FROM kpis")
        kpi_count = cursor.fetchone()['cnt']
        if kpi_count == 0:
            insert_sample_kpis(cursor)
            conn.commit()
    finally:
        conn.close()

def insert_sample_data(cursor):
    today = date.today().strftime('%Y-%m-%d')
    samples = [
        (
            "LIG DNA 기반 업무 자동화 RPA 스크립트 검증",
            "Claude Code 및 Python 기반 일일 보고서 자동 취합 워크플로우 테스트 및 검증 진행",
            "업무자동화",
            "긴급",
            "in_progress",
            today,
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        ),
        (
            "차세대 무인 체계 SW 아키텍처 기술 검토",
            "AI Agent 협업 모델 및 LiteVLA-H 논문 기반 멀티 UAV 제어 알고리즘 분석",
            "방위산업/R&D",
            "높음",
            "pending",
            today,
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        ),
        (
            "부서 간 디지털 혁신(DNA) 아이디어톤 기획서 작성",
            "전사 임직원 참여형 생성형 AI 활용 프롬프트 경진대회 및 시상 계획 수립",
            "디지털혁신",
            "보통",
            "pending",
            today,
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        ),
        (
            "2026년 하반기 공급망 리스크 데이터셋 분석 완료",
            "협력사 계약서 및 주요 단가 변동 내역 Claude AI로 신속 요약 분석 완료",
            "경영기획",
            "높음",
            "completed",
            today,
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        ),
        (
            "사내 클라우드 & Flask 웹앱 배포 가이드라인 검토",
            "Vercel 및 Supabase 연결 최적화 체크리스트 공유 및 점검",
            "일반업무",
            "낮음",
            "completed",
            today,
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        )
    ]
    cursor.executemany("""
        INSERT INTO todos (title, description, category, priority, status, due_date, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, samples)

def insert_sample_kpis(cursor):
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    samples = [
        ("RPA 자동화 스크립트 배포 건수", "월간 업무자동화 스크립트 신규 배포 목표", "업무자동화", "건", 20, 14, now, now),
        ("무인체계 SW 결함 조치율", "방산 R&D 과제 결함 리포트 조치 완료 비율", "방위산업/R&D", "%", 95, 88, now, now),
        ("디지털 혁신 아이디어 제출 건수", "전사 프롬프트 경진대회 임직원 아이디어 제출", "디지털혁신", "건", 50, 62, now, now),
        ("공급망 리스크 분석 완료율", "협력사 리스크 데이터셋 분석 완료 비율", "경영기획", "%", 100, 73, now, now),
        ("업무 가이드라인 갱신 건수", "사내 운영 가이드라인 및 체크리스트 갱신", "일반업무", "건", 12, 12, now, now),
    ]
    cursor.executemany("""
        INSERT INTO kpis (name, description, category, unit, target_value, actual_value, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, samples)

def get_todos(category=None, status=None, priority=None, search=None):
    query = "SELECT * FROM todos WHERE 1=1"
    params = []

    if category and category != 'all':
        query += " AND category = %s"
        params.append(category)

    if status and status != 'all':
        query += " AND status = %s"
        params.append(status)

    if priority and priority != 'all':
        query += " AND priority = %s"
        params.append(priority)

    if search:
        query += " AND (title LIKE %s OR description LIKE %s)"
        term = f"%{search}%"
        params.extend([term, term])

    # 정렬: 긴급/높음/보통/낮음 순 및 마감일 순, 최신순
    query += """
        ORDER BY
            CASE status WHEN 'in_progress' THEN 1 WHEN 'pending' THEN 2 ELSE 3 END,
            CASE priority WHEN '긴급' THEN 1 WHEN '높음' THEN 2 WHEN '보통' THEN 3 ELSE 4 END,
            due_date ASC,
            id DESC
    """

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

def get_todo_by_id(todo_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM todos WHERE id = %s", (todo_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def add_todo(title, description="", category="업무자동화", priority="보통", status="pending", due_date=None):
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    if not due_date:
        due_date = date.today().strftime('%Y-%m-%d')

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO todos (title, description, category, priority, status, due_date, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (title, description, category, priority, status, due_date, now, now))
        new_id = cursor.fetchone()['id']
        conn.commit()
        return new_id
    finally:
        conn.close()

def update_todo(todo_id, title, description, category, priority, status, due_date):
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE todos
            SET title = %s, description = %s, category = %s, priority = %s, status = %s, due_date = %s, updated_at = %s
            WHERE id = %s
        """, (title, description, category, priority, status, due_date, now, todo_id))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

def toggle_todo_status(todo_id):
    """상태 순환: pending -> in_progress -> completed -> pending"""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT status FROM todos WHERE id = %s", (todo_id,))
        row = cursor.fetchone()
        if not row:
            return None

        current = row['status']
        next_status = 'in_progress' if current == 'pending' else ('completed' if current == 'in_progress' else 'pending')
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        cursor.execute("UPDATE todos SET status = %s, updated_at = %s WHERE id = %s", (next_status, now, todo_id))
        conn.commit()
        return next_status
    finally:
        conn.close()

def delete_todo(todo_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM todos WHERE id = %s", (todo_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

def get_statistics():
    today = date.today().strftime('%Y-%m-%d')
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) AS cnt FROM todos")
        total = cursor.fetchone()['cnt']

        cursor.execute("SELECT COUNT(*) AS cnt FROM todos WHERE status = 'completed'")
        completed = cursor.fetchone()['cnt']

        cursor.execute("SELECT COUNT(*) AS cnt FROM todos WHERE status = 'in_progress'")
        in_progress = cursor.fetchone()['cnt']

        cursor.execute("SELECT COUNT(*) AS cnt FROM todos WHERE status = 'pending'")
        pending = cursor.fetchone()['cnt']

        cursor.execute("SELECT COUNT(*) AS cnt FROM todos WHERE due_date <= %s AND status != 'completed'", (today,))
        due_today_or_overdue = cursor.fetchone()['cnt']

        cursor.execute("SELECT category, COUNT(*) as cnt FROM todos GROUP BY category")
        categories = {row['category']: row['cnt'] for row in cursor.fetchall()}

        completion_rate = round((completed / total * 100) if total > 0 else 0, 1)

        return {
            "total": total,
            "completed": completed,
            "in_progress": in_progress,
            "pending": pending,
            "due_today_or_overdue": due_today_or_overdue,
            "completion_rate": completion_rate,
            "categories": categories
        }
    finally:
        conn.close()

def reset_to_samples():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM todos")
        insert_sample_data(cursor)
        conn.commit()
    finally:
        conn.close()


# ==========================================================================
# KPI 관리 모듈
# ==========================================================================

def _with_achievement(row):
    kpi = dict(row)
    target = float(kpi['target_value'] or 0)
    actual = float(kpi['actual_value'] or 0)
    kpi['target_value'] = target
    kpi['actual_value'] = actual
    kpi['achievement_rate'] = round((actual / target * 100) if target > 0 else 0, 1)
    if kpi['achievement_rate'] >= 100:
        kpi['status'] = 'achieved'
    elif kpi['achievement_rate'] >= 70:
        kpi['status'] = 'on_track'
    else:
        kpi['status'] = 'at_risk'
    return kpi

def get_kpis(category=None, search=None):
    query = "SELECT * FROM kpis WHERE 1=1"
    params = []

    if category and category != 'all':
        query += " AND category = %s"
        params.append(category)

    if search:
        query += " AND (name LIKE %s OR description LIKE %s)"
        term = f"%{search}%"
        params.extend([term, term])

    query += " ORDER BY id DESC"

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [_with_achievement(row) for row in rows]
    finally:
        conn.close()

def get_kpi_by_id(kpi_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM kpis WHERE id = %s", (kpi_id,))
        row = cursor.fetchone()
        return _with_achievement(row) if row else None
    finally:
        conn.close()

def add_kpi(name, description="", category="업무자동화", unit="건", target_value=0, actual_value=0):
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO kpis (name, description, category, unit, target_value, actual_value, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (name, description, category, unit, target_value, actual_value, now, now))
        new_id = cursor.fetchone()['id']
        conn.commit()
        return new_id
    finally:
        conn.close()

def update_kpi(kpi_id, name, description, category, unit, target_value, actual_value):
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE kpis
            SET name = %s, description = %s, category = %s, unit = %s,
                target_value = %s, actual_value = %s, updated_at = %s
            WHERE id = %s
        """, (name, description, category, unit, target_value, actual_value, now, kpi_id))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

def delete_kpi(kpi_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM kpis WHERE id = %s", (kpi_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

def get_kpi_statistics():
    kpis = get_kpis()
    total = len(kpis)
    achieved = sum(1 for k in kpis if k['status'] == 'achieved')
    on_track = sum(1 for k in kpis if k['status'] == 'on_track')
    at_risk = sum(1 for k in kpis if k['status'] == 'at_risk')
    avg_rate = round(sum(k['achievement_rate'] for k in kpis) / total, 1) if total > 0 else 0

    return {
        "total": total,
        "achieved": achieved,
        "on_track": on_track,
        "at_risk": at_risk,
        "avg_achievement_rate": avg_rate
    }
