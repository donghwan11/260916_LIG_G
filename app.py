"""
LIG DNA DOTO APP - Flask Application
"""
import os
import csv
import io
from flask import Flask, render_template, request, jsonify, Response, send_file
import database

app = Flask(__name__)

# 앱 시작 시 DB 초기화
database.init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/kpi')
def kpi_page():
    return render_template('kpi.html')

@app.route('/api/health')
def health_check():
    return jsonify({"status": "healthy", "app": "LIG_DNA_DOTO_APP", "version": "1.0.0"})

@app.route('/api/todos', methods=['GET'])
def list_todos():
    category = request.args.get('category')
    status = request.args.get('status')
    priority = request.args.get('priority')
    search = request.args.get('search')

    todos = database.get_todos(
        category=category,
        status=status,
        priority=priority,
        search=search
    )
    return jsonify({"success": True, "data": todos, "count": len(todos)})

@app.route('/api/todos/<int:todo_id>', methods=['GET'])
def get_todo(todo_id):
    todo = database.get_todo_by_id(todo_id)
    if not todo:
        return jsonify({"success": False, "message": "업무를 찾을 수 없습니다."}), 404
    return jsonify({"success": True, "data": todo})

@app.route('/api/todos', methods=['POST'])
def create_todo():
    data = request.get_json(silent=True) or {}
    title = data.get('title', '').strip()
    if not title:
        return jsonify({"success": False, "message": "제목을 입력해주세요."}), 400

    description = data.get('description', '').strip()
    category = data.get('category', '업무자동화')
    priority = data.get('priority', '보통')
    status = data.get('status', 'pending')
    due_date = data.get('due_date')

    todo_id = database.add_todo(
        title=title,
        description=description,
        category=category,
        priority=priority,
        status=status,
        due_date=due_date
    )
    new_todo = database.get_todo_by_id(todo_id)
    return jsonify({"success": True, "message": "업무가 등록되었습니다.", "data": new_todo}), 201

@app.route('/api/todos/<int:todo_id>', methods=['PUT'])
def update_todo(todo_id):
    data = request.get_json(silent=True) or {}
    title = data.get('title', '').strip()
    if not title:
        return jsonify({"success": False, "message": "제목을 입력해주세요."}), 400

    description = data.get('description', '').strip()
    category = data.get('category', '업무자동화')
    priority = data.get('priority', '보통')
    status = data.get('status', 'pending')
    due_date = data.get('due_date')

    updated = database.update_todo(
        todo_id=todo_id,
        title=title,
        description=description,
        category=category,
        priority=priority,
        status=status,
        due_date=due_date
    )
    if not updated:
        return jsonify({"success": False, "message": "해당 업무를 찾을 수 없습니다."}), 404

    todo = database.get_todo_by_id(todo_id)
    return jsonify({"success": True, "message": "업무가 수정되었습니다.", "data": todo})

@app.route('/api/todos/<int:todo_id>/toggle', methods=['PATCH'])
def toggle_todo(todo_id):
    next_status = database.toggle_todo_status(todo_id)
    if not next_status:
        return jsonify({"success": False, "message": "해당 업무를 찾을 수 없습니다."}), 404

    todo = database.get_todo_by_id(todo_id)
    return jsonify({"success": True, "message": f"상태가 '{next_status}'(으)로 변경되었습니다.", "data": todo})

@app.route('/api/todos/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    deleted = database.delete_todo(todo_id)
    if not deleted:
        return jsonify({"success": False, "message": "해당 업무를 찾을 수 없습니다."}), 404

    return jsonify({"success": True, "message": "업무가 삭제되었습니다."})

@app.route('/api/stats', methods=['GET'])
def stats():
    statistics = database.get_statistics()
    return jsonify({"success": True, "data": statistics})

@app.route('/api/reset', methods=['POST'])
def reset_samples():
    database.reset_to_samples()
    return jsonify({"success": True, "message": "LIG DNA 샘플 데이터로 초기화되었습니다."})

@app.route('/api/export', methods=['GET'])
def export_todos():
    export_format = request.args.get('format', 'json').lower()
    todos = database.get_todos()

    if export_format == 'csv':
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['ID', '제목', '내용', '카테고리', '우선순위', '상태', '마감일', '등록일시'])
        for t in todos:
            writer.writerow([
                t['id'], t['title'], t['description'], t['category'],
                t['priority'], t['status'], t['due_date'], t['created_at']
            ])
        output.seek(0)
        # UTF-8 BOM 추가 (Excel에서 한글 깨짐 방지)
        bom_output = '\ufeff' + output.getvalue()
        return Response(
            bom_output,
            mimetype='text/csv; charset=utf-8',
            headers={'Content-Disposition': 'attachment; filename="LIG_DNA_DOTO_LIST.csv"'}
        )
    else:
        return jsonify({"success": True, "data": todos})

@app.route('/api/kpis', methods=['GET'])
def list_kpis():
    category = request.args.get('category')
    search = request.args.get('search')

    kpis = database.get_kpis(category=category, search=search)
    return jsonify({"success": True, "data": kpis, "count": len(kpis)})

@app.route('/api/kpis/<int:kpi_id>', methods=['GET'])
def get_kpi(kpi_id):
    kpi = database.get_kpi_by_id(kpi_id)
    if not kpi:
        return jsonify({"success": False, "message": "KPI를 찾을 수 없습니다."}), 404
    return jsonify({"success": True, "data": kpi})

@app.route('/api/kpis', methods=['POST'])
def create_kpi():
    data = request.get_json(silent=True) or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({"success": False, "message": "KPI명을 입력해주세요."}), 400

    try:
        target_value = float(data.get('target_value', 0))
        actual_value = float(data.get('actual_value', 0))
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "목표치/실적치는 숫자로 입력해주세요."}), 400

    description = data.get('description', '').strip()
    category = data.get('category', '업무자동화')
    unit = data.get('unit', '건').strip() or '건'

    kpi_id = database.add_kpi(
        name=name,
        description=description,
        category=category,
        unit=unit,
        target_value=target_value,
        actual_value=actual_value
    )
    new_kpi = database.get_kpi_by_id(kpi_id)
    return jsonify({"success": True, "message": "KPI가 등록되었습니다.", "data": new_kpi}), 201

@app.route('/api/kpis/<int:kpi_id>', methods=['PUT'])
def update_kpi(kpi_id):
    data = request.get_json(silent=True) or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({"success": False, "message": "KPI명을 입력해주세요."}), 400

    try:
        target_value = float(data.get('target_value', 0))
        actual_value = float(data.get('actual_value', 0))
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "목표치/실적치는 숫자로 입력해주세요."}), 400

    description = data.get('description', '').strip()
    category = data.get('category', '업무자동화')
    unit = data.get('unit', '건').strip() or '건'

    updated = database.update_kpi(
        kpi_id=kpi_id,
        name=name,
        description=description,
        category=category,
        unit=unit,
        target_value=target_value,
        actual_value=actual_value
    )
    if not updated:
        return jsonify({"success": False, "message": "해당 KPI를 찾을 수 없습니다."}), 404

    kpi = database.get_kpi_by_id(kpi_id)
    return jsonify({"success": True, "message": "KPI가 수정되었습니다.", "data": kpi})

@app.route('/api/kpis/<int:kpi_id>', methods=['DELETE'])
def delete_kpi(kpi_id):
    deleted = database.delete_kpi(kpi_id)
    if not deleted:
        return jsonify({"success": False, "message": "해당 KPI를 찾을 수 없습니다."}), 404

    return jsonify({"success": True, "message": "KPI가 삭제되었습니다."})

@app.route('/api/kpis/stats', methods=['GET'])
def kpi_stats():
    statistics = database.get_kpi_statistics()
    return jsonify({"success": True, "data": statistics})

if __name__ == '__main__':
    import sys
    if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    # 로컬 개발 서버 실행 (포트 5000)
    print("==================================================")
    print(" [*] LIG DNA DOTO APP - Server Starting")
    print(" [*] Local URL: http://127.0.0.1:5000")
    print("==================================================")
    app.run(host='0.0.0.0', port=5000, debug=False)

