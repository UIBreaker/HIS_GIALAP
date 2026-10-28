'use strict';

// HIS form mô phỏng. Mọi tọa độ tính theo pixel tương đối với khung 1020 × 514.
// Các control là <input>, <select>, <button> HTML THẬT, không phải ảnh nền.
(() => {
  const form = document.getElementById('registration-form');
  const tbody = document.getElementById('records-body');
  const statusEl = document.getElementById('status-message');
  const STORAGE_KEY = 'his-registration-demo-v1';
  const requiredIds = ['registration_date', 'full_name', 'birth_day', 'birth_month', 'birth_year',
    'gender', 'ethnicity', 'nationality', 'occupation', 'ward', 'district', 'province',
    'patient_group', 'department', 'arrival_method'];
  const insuranceIds = [];
  const insuranceLabels = [];
  let editingId = null;
  let records = [];

  function pos(el, x, y, w, h) {
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    if (w !== undefined) el.style.width = `${w}px`;
    if (h !== undefined) el.style.height = `${h}px`;
    return el;
  }
  function add(tag, cls, x, y, w, h) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    pos(el, x, y, w, h);
    form.appendChild(el);
    return el;
  }
  function label(text, x, y, w, opt = {}) {
    const el = add('label', `label ${opt.muted ? 'muted ' : ''}${opt.bold ? 'bold ' : ''}${opt.color || ''}`, x, y, w);
    if (opt.for) el.htmlFor = opt.for;
    if (opt.align) el.style.textAlign = opt.align;
    el.appendChild(document.createTextNode(text));
    if (opt.star) {
      const star = document.createElement('span');
      star.className = 'required'; star.textContent = '*'; el.appendChild(star);
    }
    if (opt.insurance) insuranceLabels.push(el);
    return el;
  }
  function note(text, x, y, w, css = '') {
    return Object.assign(add('div', `note ${css}`, x, y, w), { textContent: text });
  }
  function input(id, x, y, w, value = '', opt = {}) {
    const el = add('input', opt.cls || '', x, y, w, opt.h || 22);
    el.type = opt.type || 'text'; el.name = id; el.id = id; el.value = value;
    if (opt.title) el.title = opt.title;
    if (opt.maxLength) el.maxLength = opt.maxLength;
    if (opt.placeholder) el.placeholder = opt.placeholder;
    if (opt.numeric) el.inputMode = 'numeric';
    if (opt.disabled) el.disabled = true;
    if (opt.readOnly) el.readOnly = true;
    if (opt.insurance) insuranceIds.push(id);
    return el;
  }
  function select(id, x, y, w, values, selected = '', opt = {}) {
    const el = add('select', opt.cls || '', x, y, w, opt.h || 22);
    el.name = id; el.id = id; el.title = opt.title || id;
    for (const item of values) {
      const option = document.createElement('option');
      if (Array.isArray(item)) { option.value = item[0]; option.textContent = item[1]; }
      else { option.value = item; option.textContent = item; }
      el.appendChild(option);
    }
    el.value = selected;
    if (opt.disabled) el.disabled = true;
    if (opt.insurance) insuranceIds.push(id);
    return el;
  }
  function checkbox(id, x, y, text, opt = {}) {
    const wrap = add('label', `checkbox-field ${opt.css || ''}`, x, y, opt.w);
    const el = document.createElement('input'); el.type = 'checkbox'; el.name = id; el.id = id;
    el.checked = Boolean(opt.checked);
    if (opt.disabled) el.disabled = true;
    wrap.appendChild(el);
    wrap.appendChild(document.createTextNode(text));
    if (opt.insurance) insuranceIds.push(id);
    return el;
  }
  function line(y) { add('div', 'divider', 0, y); }
  function button(text, x, y, w, action) {
    const el = add('button', 'mini-button', x, y, w, 22);
    el.type = 'button'; el.textContent = text; el.addEventListener('click', action);
    return el;
  }
  const blankSelect = ['', 'Có', 'Không'];
  const yesNo = ['', 'Có', 'Không'];

  // Đường phân khu, panel và biểu tượng đầu dòng.
  add('div', 'insurance-overlay', 5, 201, 1008, 91);
  add('div', 'referral-area', 308, 355, 705, 100);
  line(166); line(322);
  const svg = add('div', 'fingerprint', 14, 6, 15, 19);
  svg.innerHTML = `<svg viewBox="0 0 24 28" width="15" height="19" fill="none" stroke="#222" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M3 10c0-13 18-13 18 0M5 13c-1-12 15-12 14 0M8 24c5-8-2-15 4-15 7 0-1 13 3 16M5 19c3-7-2-13 7-13 10 0 6 11 8 14M9 26c5-6 0-12 4-12M3 15c0 5-1 7-2 8M18 24c-2-4 0-8 0-11"/></svg>`;

  // ────────────────── 1. THÔNG TIN BỆNH NHÂN ──────────────────
  label('Mã BN:', 43, 4, 53, {for: 'patient_code'});
  input('patient_code', 95, 4, 73, '0000068019', { numeric: true, maxLength: 15 });
  label('MãKCB:', 173, 4, 50, {for: 'visit_code'});
  input('visit_code', 222, 4, 80, '2600133487', { numeric: true, maxLength: 18 });
  label('Ngày đăng ký', 307, 4, 97, {star: true, for: 'registration_date'});
  input('registration_date', 404, 4, 76, '15/10/2026', { maxLength: 10, title: 'Định dạng dd/mm/yyyy' });
  input('registration_time', 480, 4, 42, '13:38', {maxLength: 5, title: 'HH:mm'});
  select('registration_time_list', 522, 4, 14, [''], '', {title: 'Chọn giờ'});
  label('Số thứ tự:', 533, 4, 62, {for: 'queue_number'});
  input('queue_number', 594, 4, 52, '39', {numeric: true});
  label('làm?', 648, 4, 42, {muted: true});
  note('(40 tuổi)', 651, 35, 40, 'age');
  checkbox('inpatient', 755, 4, 'Nội trú', {w: 68});
  checkbox('transferred', 823, 4, 'C.Viện', {w: 66});
  checkbox('discharged', 889, 4, 'R.Viện', {w: 64, checked: true});
  checkbox('settled', 953, 4, 'T.Toán', {w: 63});

  label('Họ và tên:', 8, 35, 86, {star: true, for: 'full_name'});
  input('full_name', 95, 35, 207, 'LÂM NGỌC THỦY TIÊN');
  label('Ngày sinh:', 307, 35, 97, {star: true, for: 'birth_day'});
  input('birth_day', 404, 35, 25, '14', {maxLength: 2, numeric:true, title:'Ngày sinh (ngày)'});
  input('birth_month', 429, 35, 25, '05', {maxLength: 2, numeric:true, title:'Ngày sinh (tháng)'});
  input('birth_year', 454, 35, 43, '1986', {maxLength: 4, numeric:true, title:'Ngày sinh (năm)'});
  input('birth_extra', 497, 35, 39, '');
  label('Giới tính', 535, 35, 56, {star: true, for: 'gender'});
  select('gender', 592, 35, 56, ['', 'Nam', 'Nữ', 'Khác'], 'Nữ');
  label('Dân tộc', 692, 35, 55, {star: true, for: 'ethnicity'});
  select('ethnicity', 747, 35, 71, ['', 'Kinh', 'Tày', 'Thái', 'Hoa', 'Khác'], 'Kinh');
  label('Quốc tịch', 822, 35, 63, {star: true, for: 'nationality'});
  select('nationality', 885, 35, 128, ['', 'Việt Nam', 'Khác'], 'Việt Nam');

  label('Số CCCD:', 8, 61, 87, {for: 'national_id'});
  input('national_id', 95, 61, 120, '070186003202', {maxLength: 12, numeric:true});
  input('id_issue_date', 215, 61, 87, '29/01/2026', {maxLength: 10, title: 'Ngày cấp CCCD'});
  label('Nơi cấp CCCD:', 307, 61, 97, {for: 'id_issue_place'});
  select('id_issue_place', 404, 61, 244, ['', 'Bộ Công an', 'Cục Cảnh sát QLHC về TTXH', 'Công an tỉnh Đồng Nai'], '');
  label('Nghề nghiệp', 654, 61, 93, {star: true, for: 'occupation'});
  select('occupation', 747, 61, 266, ['', 'Công nhân', 'Nông dân', 'Nhân viên văn phòng', 'Công chức', 'Viên chức', 'Học sinh / Sinh viên', 'Khác'], 'Công nhân');

  label('Nơi làm việc:', 8, 88, 87, {for: 'workplace'});
  input('workplace', 95, 88, 207);
  label('Sn/thôn (phố):', 307, 88, 97, {for: 'house_number'});
  input('house_number', 404, 88, 54);
  input('hamlet', 458, 88, 190, 'Tổ 2', {title:'Thôn / phố'});
  label('Gõ tắt địa chỉ:', 654, 88, 93, {for:'address_shortcut'});
  select('address_shortcut', 747, 88, 121, ['', 'Địa chỉ thường trú', 'Địa chỉ tạm trú'], '');
  label('Tai nạn:', 870, 88, 61, {for: 'accident'});
  select('accident', 931, 88, 82, ['', 'Không', 'Có'], '');

  label('Phường/xã:', 8, 114, 87, {star:true, for:'ward'});
  select('ward', 95, 114, 156, ['', 'Phường An Lộc', 'Phường Bình Long', 'Phường Đồng Xoài', 'Phường Trấn Biên', 'Xã khác'], 'Phường An Lộc');
  input('ward_code', 251, 114, 51, '25333', {numeric:true});
  label('Quận/ huyện:', 307, 114, 97, {star:true, for:'district'});
  select('district', 404, 114, 202, ['', 'Thành phố Long Khánh', 'Thành phố Biên Hòa', 'Huyện Xuân Lộc', 'Huyện Trảng Bom', 'Khác'], '');
  input('district_code', 606, 114, 42, '75', {numeric:true});
  label('Tỉnh/ thành:', 654, 114, 93, {star:true, for:'province'});
  select('province', 747, 114, 232, ['', 'Thành phố Đồng Nai', 'Tỉnh Đồng Nai', 'TP. Hồ Chí Minh', 'Tỉnh khác'], 'Thành phố Đồng Nai');
  input('province_code', 979, 114, 34, '75', {numeric:true});

  label('Điện thoại:', 11, 141, 84, {for:'phone'});
  input('phone', 95, 141, 207, '', {type:'tel', maxLength:15});
  label('Hình thức nhập:', 788, 141, 98, {for:'input_method'});
  select('input_method', 886, 141, 107, ['Quét CCCD', 'Nhập thủ công', 'Quét BHYT'], 'Quét CCCD');
  const lock = add('button', 'symbol scan-shortcut', 994, 141, 20, 22); lock.type='button'; lock.id='scan-shortcut'; lock.textContent = '▣'; lock.title = 'Quét CCCD giả lập để tự điền form'; lock.setAttribute('aria-label','Quét CCCD giả lập');

  // ────────────────── 2. ĐỐI TƯỢNG / THẺ BHYT ──────────────────
  label('Đối tượng:', 8, 176, 87, {star:true, bold:true, for:'patient_group'});
  select('patient_group', 95, 177, 207, ['', 'Khám sức khỏe TT25', 'Bảo hiểm y tế (BHYT)', 'Khám dịch vụ', 'Khám sức khỏe định kỳ', 'Khám cấp cứu'], 'Khám sức khỏe TT25');
  label('Số thẻ BH:', 8, 211, 87, {star:true, muted:true, for:'insurance_number', insurance:true});
  input('insurance_part1', 95, 212, 26, '', {disabled:true, insurance:true});
  input('insurance_part2', 121, 212, 25, '', {disabled:true, insurance:true});
  input('insurance_part3', 146, 212, 25, '', {disabled:true, insurance:true});
  input('insurance_number', 171, 212, 131, '', {disabled:true, insurance:true});
  note('Thẻ tạm', 303, 197, 54);
  checkbox('temporary_card', 309, 212, '', {w:18, disabled:true, insurance:true});
  label('Hạn thẻ:', 332, 211, 72, {star:true, muted:true, for:'insurance_start', insurance:true});
  select('insurance_start', 404, 212, 86, ['', '01/01/2026', '01/01/2027', '01/01/2028'], '', {disabled:true, insurance:true});
  label('đến:', 493, 211, 48, {star:true, muted:true, for:'insurance_end', insurance:true});
  select('insurance_end', 541, 212, 84, ['', '31/12/2026', '31/12/2027', '31/12/2028'], '', {disabled:true, insurance:true});
  const verify = add('span', 'symbol', 628, 212, 22); verify.textContent = '✅'; verify.title='Kiểm tra thẻ: mô phỏng, không tra cứu thực';
  label('Nơi đăng ký:', 657, 211, 91, {star:true, muted:true, for:'insurance_registration_place', insurance:true});
  select('insurance_registration_place', 748, 212, 264, ['', 'Bệnh viện đa khoa', 'Trạm y tế xã', 'Cơ sở khác'], '', {disabled:true, insurance:true});
  label('Nơi cấp thẻ:', 8, 238, 87, {star:true, muted:true, for:'insurance_issued_by', insurance:true});
  select('insurance_issued_by', 95, 238, 207, ['', 'BHXH tỉnh Đồng Nai', 'BHXH Việt Nam', 'Nơi khác'], '', {disabled:true, insurance:true});
  label('Địa chỉ thẻ:', 322, 238, 82, {star:true, muted:true, for:'insurance_address', insurance:true});
  input('insurance_address', 404, 238, 341, '', {disabled:true, insurance:true});
  label('Đủ 5 năm:', 8, 266, 87, {muted:true, for:'five_years', insurance:true});
  select('five_years', 95, 265, 83, yesNo, '', {disabled:true, insurance:true});
  label('Lũy kế:', 180, 265, 54, {muted:true, for:'accumulated', insurance:true});
  input('accumulated', 233, 265, 69, '0,00', {disabled:true, insurance:true, cls:'right-text'});
  label('Tuyến KB:', 322, 265, 82, {star:true, muted:true, for:'insurance_route', insurance:true});
  select('insurance_route', 404, 265, 141, ['', 'Đúng tuyến', 'Trái tuyến', 'Cấp cứu'], '', {disabled:true, insurance:true});
  label('Mã nơi SS:', 551, 265, 75, {muted:true, for:'birthplace_code', insurance:true});
  select('birthplace_code', 626, 265, 43, ['', '75', '79'], '', {disabled:true, insurance:true});
  label('Số BHXH:', 679, 265, 69, {for:'social_insurance'});
  input('social_insurance', 748, 265, 137, '', {disabled:true, insurance:true});

  label('Phòng ĐK:', 11, 295, 84, {star:true, for:'department'});
  select('department', 95, 295, 207, ['', 'Phòng khám số 20(KSK)', 'Phòng khám số 1', 'Phòng khám số 2', 'Khám nội tổng hợp'], 'Phòng khám số 20(KSK)');
  label('Khoa Khám bệnh', 323, 295, 152);
  label('Kê tiền khám:', 662, 295, 86, {for:'examination_fee'});
  select('examination_fee', 748, 295, 244, ['', 'Có kê tiền khám', 'Không kê tiền khám', 'Miễn phí'], '');
  checkbox('fee_paid', 996, 295, '', {w:16});

  // ────────────────── 3. LOẠI KHÁM, CHUYỂN VIỆN, LIÊN HỆ ──────────────────
  label('Loại hình KCB:', 1, 328, 94, {for:'examination_type'});
  select('examination_type', 95, 328, 151,
    ['15 | Khám sức khỏe định kỳ', '01 | Khám bệnh', '02 | Điều trị ngoại trú', '03 | Cấp cứu'],
    '15 | Khám sức khỏe định kỳ');
  label('ĐT KCB:', 254, 328, 55, {for:'kcb_type'});
  select('kcb_type', 309, 328, 187,
    ['9 | Người bệnh không KCB BHYT', '1 | Người bệnh có BHYT', '2 | Khám dịch vụ'],
    '9 | Người bệnh không KCB BHYT');
  checkbox('emergency', 497, 328, 'Cấp cứu', {w:77, css:'red'});
  checkbox('api', 574, 328, 'API', {w:46});
  checkbox('dtn', 620, 328, 'ĐTNT', {w:56});
  checkbox('chronic', 677, 328, 'Mãn tính', {w:67});
  checkbox('kltn', 745, 328, 'KLTN', {w:53});
  checkbox('kl', 799, 328, 'KL', {w:38});
  checkbox('ng', 837, 328, 'NG', {w:38});
  checkbox('tekt', 874, 328, 'TEKT', {w:52});
  checkbox('bqk', 926, 328, 'BQK', {w:48});
  checkbox('lx', 973, 328, 'LX', {w:40});

  label('Hình thức đến:', 1, 355, 94, {star:true, for:'arrival_method'});
  select('arrival_method', 95, 355, 207, ['Tự đến', 'Chuyển tuyến', 'Cấp cứu', 'Đăng ký trực tuyến'], 'Tự đến');
  label('Nơi giới thiệu:', 313, 355, 91, {muted:true, for:'referral_source'});
  select('referral_source', 404, 355, 241, ['', 'Trạm y tế', 'Bệnh viện tuyến dưới', 'Cơ quan / Đơn vị'], '', {disabled:true});
  const referralSymbol = add('span', 'symbol', 647, 355, 22); referralSymbol.textContent = '⚑';
  label('Hình thức:', 681, 355, 67, {muted:true, for:'referral_method'});
  select('referral_method', 748, 355, 264, ['', 'Giấy chuyển tuyến', 'Giới thiệu', 'Khác'], '', {disabled:true});

  label('Lý do vào viện:', 1, 379, 94, {for:'reason_admission'});
  select('reason_admission', 95, 379, 207, ['', 'Khám sức khỏe', 'Khám bệnh', 'Điều trị', 'Theo hẹn'], '');
  label('Lý do chuyển:', 313, 379, 91, {muted:true, for:'transfer_reason'});
  select('transfer_reason', 404, 379, 241, ['', 'Theo yêu cầu chuyên môn', 'Theo yêu cầu người bệnh'], '', {disabled:true});
  label('Ngày điều trị:', 655, 379, 93, {muted:true, for:'treatment_start'});
  input('treatment_start', 748, 379, 76, '', {disabled:true});
  label('-', 825, 379, 10, {muted:true});
  input('treatment_end', 836, 379, 66, '', {disabled:true});
  input('treatment_notes', 904, 379, 108, '', {disabled:true});

  label('Ưu tiên:', 1, 402, 94, {for:'priority'});
  select('priority', 95, 402, 207, ['', 'Người cao tuổi', 'Người khuyết tật', 'Phụ nữ mang thai', 'Trẻ dưới 6 tuổi', 'Khác'], '');
  label('Lãnh đạo:', 313, 402, 91, {muted:true, for:'leader'});
  input('leader', 404, 402, 136, '', {disabled:true});
  label('Khoa:', 542, 402, 47, {muted:true, for:'referred_department'});
  input('referred_department', 589, 402, 121, '', {disabled:true});
  label('Số:', 710, 402, 38, {muted:true, for:'transfer_number'});
  input('transfer_number', 748, 402, 77, '', {disabled:true});
  label('Ngày:', 826, 402, 62, {muted:true, for:'transfer_date'});
  input('transfer_date', 888, 402, 79, '', {disabled:true});
  input('transfer_month', 967, 402, 29, '', {disabled:true});
  select('transfer_last', 996, 402, 16, [''], '', {disabled:true});

  checkbox('priority_patient', 8, 427, 'BN Ưu tiên', {w:138, css:'blue'});
  button('ICD10', 594, 429, 56, () => announce('Mã ICD-10 chỉ được mô phỏng. Chưa kết nối danh mục bệnh.', false));
  label('Số hẹn khám:', 655, 427, 93, {for:'appointment_number'});
  input('appointment_number', 748, 427, 77);
  label('Ngày:', 826, 427, 62, {for:'appointment_date'});
  input('appointment_date', 888, 427, 79, '', {title:'dd/mm/yyyy'});
  input('appointment_hour', 967, 427, 29);
  select('appointment_last', 996, 427, 16, [''], '');

  label('Người liên hệ:', 8, 460, 87, {for:'contact_name'});
  input('contact_name', 95, 459, 207);
  label('Số CCCD:', 312, 459, 92, {for:'contact_id'});
  input('contact_id', 404, 459, 98, '', {numeric:true});
  label('ĐT:', 502, 459, 45, {for:'contact_phone'});
  input('contact_phone', 547, 459, 101, '', {type:'tel'});
  label('Địa chỉ liên hệ:', 655, 459, 93, {for:'contact_address'});
  input('contact_address', 748, 459, 264);
  label('Mối quan hệ:', 463, 484, 84, {for:'relationship'});
  select('relationship', 547, 484, 101, ['', 'Bố', 'Mẹ', 'Vợ', 'Chồng', 'Con', 'Anh/Chị/Em', 'Khác'], '');
  label('G.tờ kèm theo:', 655, 484, 93, {for:'attached_document'});
  select('attached_document', 748, 484, 99, ['', 'CCCD', 'BHYT', 'Giấy chuyển viện', 'Giấy khác'], '');
  input('attached_document_number', 847, 484, 165);

  // ────────────────── TƯƠNG TÁC THỰC ──────────────────
  const formElements = [...form.querySelectorAll('input[name],select[name]')];
  const sample = Object.fromEntries(formElements.map(el => [el.name, el.type === 'checkbox' ? el.checked : el.value]));
  function announce(message, isError = false) {
    statusEl.textContent = message;
    statusEl.classList.toggle('error', isError);
  }
  function applyInsuranceState() {
    const enabled = selectValue('patient_group') === 'Bảo hiểm y tế (BHYT)';
    for (const id of insuranceIds) document.getElementById(id).disabled = !enabled;
    for (const el of insuranceLabels) el.classList.toggle('muted', !enabled);
  }
  function selectValue(id) { return document.getElementById(id)?.value || ''; }
  function updateAge() {
    const day = Number(selectValue('birth_day'));
    const month = Number(selectValue('birth_month'));
    const year = Number(selectValue('birth_year'));
    const node = form.querySelector('.age');
    if (!node) return;
    const today = new Date();
    const date = new Date(year, month-1, day);
    if (!year || year < 1900 || year > today.getFullYear() || date.getFullYear() !== year ||
       date.getMonth() !== month - 1 || date.getDate() !== day) { node.textContent = '(— tuổi)'; return; }
    let age = today.getFullYear() - year;
    if ((today.getMonth()+1 < month) || (today.getMonth()+1 === month && today.getDate() < day)) age--;
    node.textContent = `(${age} tuổi)`;
  }
  function applyReferralState() {
    const enabled = selectValue('arrival_method') === 'Chuyển tuyến';
    for (const id of ['referral_source','referral_method','transfer_reason','treatment_start',
      'treatment_end','treatment_notes','leader','referred_department','transfer_number','transfer_date',
      'transfer_month','transfer_last']) document.getElementById(id).disabled = !enabled;
  }
  function values() {
    return Object.fromEntries(formElements.map(el => [el.name, el.type === 'checkbox' ? el.checked : el.value.trim()]));
  }
  function assign(data) {
    for (const el of formElements) {
      if (!(el.name in data)) continue;
      if (el.type === 'checkbox') el.checked = Boolean(data[el.name]);
      else { ensureOption(el, data[el.name]); el.value = data[el.name] ?? ''; }
    }
    applyInsuranceState(); applyReferralState(); updateAge();
  }
  function validDate(day, month, year) {
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }
  function isValidDMY(value) {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    return !!match && validDate(+match[1], +match[2], +match[3]);
  }
  function validate(data) {
    for (const id of requiredIds) {
      if (!data[id]) {
        const el = document.getElementById(id);
        el.focus();
        announce(`Vui lòng nhập/chọn trường bắt buộc: ${el.getAttribute('title') || id}.`, true);
        return false;
      }
    }
    if (!validDate(+data.birth_day,+data.birth_month,+data.birth_year) ||
       +data.birth_year < 1900 || +data.birth_year > new Date().getFullYear()) {
      document.getElementById('birth_day').focus();
      announce('Ngày sinh không hợp lệ.', true); return false;
    }
    if (!isValidDMY(data.registration_date)) {
      document.getElementById('registration_date').focus();
      announce('Ngày đăng ký phải theo định dạng dd/mm/yyyy và là ngày hợp lệ.', true); return false;
    }
    if (data.national_id && !/^\d{9}$|^\d{12}$/.test(data.national_id)) {
      document.getElementById('national_id').focus();
      announce('Số CCCD/CMND phải gồm 9 hoặc 12 chữ số.', true); return false;
    }
    if (data.phone && !/^[\d+().\s-]{9,18}$/.test(data.phone)) {
      document.getElementById('phone').focus();
      announce('Số điện thoại chưa đúng định dạng.', true); return false;
    }
    return true;
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }
    catch (err) { announce('Không thể lưu vào trình duyệt. Hãy kiểm tra cài đặt lưu trữ.', true); }
  }
  // ────────────────── GIẢ LẬP QUÉT CCCD & DỮ LIỆU THỬ NGHIỆM ──────────────────
  // Tiền tố 999 không phải mã tỉnh/thành hợp lệ; không phát sinh CCCD thật.
  const demoFirstNames = ['NGUYỄN', 'TRẦN', 'LÊ', 'PHẠM', 'VÕ', 'ĐẶNG', 'HOÀNG', 'PHAN', 'ĐỖ', 'BÙI'];
  const demoMiddleNames = ['THỊ', 'NGỌC', 'MINH', 'THANH', 'QUỐC', 'VĂN', 'HỮU', 'GIA', 'ĐỨC', 'HOÀI'];
  const demoGivenNames = ['AN', 'BÌNH', 'CHÂU', 'DŨNG', 'GIANG', 'HÀ', 'HẢI', 'HÙNG', 'LAN', 'LINH', 'LONG', 'MAI', 'NAM', 'PHƯƠNG', 'QUÂN', 'THẢO', 'TRANG', 'TUẤN', 'UYÊN', 'VY'];
  const demoPlaces = [
    {province:'Tỉnh Đồng Nai', province_code:'75', district:'Thành phố Biên Hòa', district_code:'75', ward:'Phường Trấn Biên', ward_code:'25333', hamlet:'Tổ 2'},
    {province:'Tỉnh Đồng Nai', province_code:'75', district:'Thành phố Long Khánh', district_code:'75', ward:'Phường An Lộc', ward_code:'25333', hamlet:'Khu phố 3'},
    {province:'Tỉnh Đồng Nai', province_code:'75', district:'Thành phố Đồng Xoài', district_code:'75', ward:'Phường Đồng Xoài', ward_code:'25333', hamlet:'Tổ 5'},
    {province:'TP. Hồ Chí Minh', province_code:'79', district:'Thành phố Thủ Đức', district_code:'79', ward:'Phường Linh Trung', ward_code:'00001', hamlet:'Khu phố 1'},
    {province:'Tỉnh Tây Ninh', province_code:'80', district:'Thị xã Trảng Bàng', district_code:'80', ward:'Phường Trảng Bàng', ward_code:'00002', hamlet:'Khu phố 4'}
  ];
  const demoOccupations = ['Công nhân', 'Nông dân', 'Nhân viên văn phòng', 'Công chức', 'Viên chức', 'Học sinh / Sinh viên'];
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const randomDigits = count => Array.from({length:count}, () => Math.floor(Math.random()*10)).join('');
  const pad2 = n => String(n).padStart(2, '0');
  const dateDMY = d => `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}`;
  const timeHM = d => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2,11)}`;
  const today = () => new Date();
  let lastScanData = null;
  let detailRecordId = null;

  function makeMockPerson() {
    const location = pick(demoPlaces);
    const year = 1958 + Math.floor(Math.random()*50);
    const month = 1 + Math.floor(Math.random()*12);
    const lastDay = new Date(year,month,0).getDate();
    const day = 1 + Math.floor(Math.random()*lastDay);
    const gender = pick(['Nam','Nữ']);
    let nationalId;
    do {nationalId = `999${randomDigits(9)}`;} while (records.some(r => r.national_id === nationalId));
    return {
      patient_code: `99${randomDigits(8)}`,
      visit_code: `99${randomDigits(8)}`,
      queue_number: String(1+Math.floor(Math.random()*95)),
      registration_date: dateDMY(today()),
      registration_time: timeHM(today()),
      full_name: `${pick(demoFirstNames)} ${pick(demoMiddleNames)} ${pick(demoGivenNames)}`,
      birth_day:pad2(day), birth_month:pad2(month), birth_year:String(year), birth_extra:'',
      gender, ethnicity:'Kinh', nationality:'Việt Nam', national_id:nationalId,
      id_issue_date: `${pad2(1+Math.floor(Math.random()*28))}/${pad2(1+Math.floor(Math.random()*12))}/${2021+Math.floor(Math.random()*5)}`,
      id_issue_place:'Bộ Công an', occupation:pick(demoOccupations),
      workplace:'', house_number:String(1+Math.floor(Math.random()*120)),
      hamlet: location.hamlet, ward:location.ward, ward_code:location.ward_code,
      district:location.district, district_code:location.district_code,
      province:location.province, province_code:location.province_code,
      phone:`000${randomDigits(7)}`,
      input_method:'Quét CCCD',
      patient_group:'Khám sức khỏe TT25',
      department:'Phòng khám số 20(KSK)',
      examination_type:'15 | Khám sức khỏe định kỳ',
      kcb_type:'9 | Người bệnh không KCB BHYT',
      arrival_method:'Tự đến',
      discharged:false, emergency:false,
      accident:'Không',
      priority_patient:false,
      contact_name:'',contact_id:'',contact_phone:'',contact_address:'',relationship:''
    };
  }

  function ensureOption(el, value) {
    if (!value || el.tagName !== 'SELECT' || Array.from(el.options).some(o => o.value === value)) return;
    const option = document.createElement('option'); option.value=value; option.textContent=value; el.appendChild(option);
  }
  function fillFromScan(person, {scroll = true} = {}) {
    editingId = null;
    lastScanData = person;
    const empty = Object.fromEntries(formElements.map(el => [el.name, el.type === 'checkbox' ? false : '']));
    const defaults = {
      registration_date:dateDMY(today()), registration_time:timeHM(today()),
      patient_group:'Khám sức khỏe TT25', department:'Phòng khám số 20(KSK)',
      examination_type:'15 | Khám sức khỏe định kỳ',
      kcb_type:'9 | Người bệnh không KCB BHYT', arrival_method:'Tự đến'
    };
    assign({...empty, ...defaults, ...person});
    updateCard(person);
    announce(`Đã quét CCCD giả lập ${person.national_id} và tự điền form. Kiểm tra rồi bấm “Lưu bản ghi”.`);
    if (scroll) window.scrollTo({top:0, behavior:'smooth'});
  }
  function updateCard(person) {
    const fields = {
      'card-full-name':person.full_name,
      'card-national-id':person.national_id,
      'card-birth':`${person.birth_day}/${person.birth_month}/${person.birth_year} · ${person.gender}`,
      'card-address':`${person.hamlet}, ${person.ward}, ${person.district}, ${person.province}`
    };
    for (const [id,value] of Object.entries(fields)) document.getElementById(id).textContent=value;
    document.getElementById('scan-result').textContent = `Quét thành công: ${person.full_name} • CCCD: ${person.national_id} • Ngày sinh: ${person.birth_day}/${person.birth_month}/${person.birth_year}. Thông tin đã được điền vào form. Chọn “Lưu bản ghi” để đưa vào danh sách đăng ký.`;
    const card=document.getElementById('mock-card');
    card.classList.remove('scanned'); void card.offsetWidth; card.classList.add('scanned');
  }
  function makeSyntheticRecord(source='Dữ liệu mẫu') {
    const person=makeMockPerson();
    return {...sample, ...person, _id:createId(), _source:source, _createdAt:new Date().toISOString()};
  }

  // ────────────────── DANH SÁCH & XEM CHI TIẾT ──────────────────
  const detailGroups = [
    ['Thông tin đăng ký', [
      ['patient_code','Mã bệnh nhân'],['visit_code','Mã khám chữa bệnh'],['queue_number','Số thứ tự'],
      ['registration_date','Ngày đăng ký'],['registration_time','Giờ đăng ký'],['input_method','Hình thức nhập'],
      ['patient_group','Đối tượng'],['department','Phòng đăng ký'],['examination_fee','Kê tiền khám'],
      ['fee_paid','Đã thu phí'],['inpatient','Nội trú'],['transferred','Chuyển viện'],['discharged','Ra viện'],['settled','Thanh toán']
    ]],
    ['Thông tin căn cước công dân', [
      ['full_name','Họ và tên'],['birth_day','Ngày sinh (ngày)'],['birth_month','Ngày sinh (tháng)'],
      ['birth_year','Ngày sinh (năm)'],['gender','Giới tính'],['national_id','Số CCCD'],
      ['id_issue_date','Ngày cấp CCCD'],['id_issue_place','Nơi cấp CCCD'],
      ['ethnicity','Dân tộc'],['nationality','Quốc tịch'],['occupation','Nghề nghiệp'],['phone','Điện thoại']
    ]],
    ['Địa chỉ và nơi làm việc', [
      ['house_number','Số nhà'],['hamlet','Thôn / khu phố'],['ward','Phường / xã'],
      ['ward_code','Mã phường / xã'],['district','Quận / huyện'],['district_code','Mã quận / huyện'],
      ['province','Tỉnh / thành'],['province_code','Mã tỉnh / thành'],['workplace','Nơi làm việc'],
      ['address_shortcut','Gõ tắt địa chỉ'],['accident','Tai nạn']
    ]],
    ['BHYT / BHXH', [
      ['insurance_part1','Thẻ BH phần 1'],['insurance_part2','Thẻ BH phần 2'],['insurance_part3','Thẻ BH phần 3'],
      ['insurance_number','Số thẻ BH'],['temporary_card','Thẻ tạm'],['insurance_start','Hạn thẻ từ'],
      ['insurance_end','Hạn thẻ đến'],['insurance_registration_place','Nơi đăng ký BHYT'],
      ['insurance_issued_by','Nơi cấp thẻ'],['insurance_address','Địa chỉ thẻ'],
      ['five_years','Đủ 5 năm'],['accumulated','Lũy kế'],['insurance_route','Tuyến khám bệnh'],
      ['birthplace_code','Mã nơi sinh sống'],['social_insurance','Số BHXH']
    ]],
    ['Khám bệnh, chuyển tuyến & ưu tiên', [
      ['examination_type','Loại hình KCB'],['kcb_type','Đối tượng KCB'],['emergency','Cấp cứu'],
      ['api','API'],['dtn','ĐTNT'],['chronic','Mãn tính'],['kltn','KLTN'],['kl','KL'],['ng','NG'],
      ['tekt','TEKT'],['bqk','BQK'],['lx','LX'],['arrival_method','Hình thức đến'],
      ['reason_admission','Lý do vào viện'],['priority','Ưu tiên'],['priority_patient','BN ưu tiên'],
      ['referral_source','Nơi giới thiệu'],['referral_method','Hình thức chuyển'],
      ['transfer_reason','Lý do chuyển'],['leader','Lãnh đạo'],['referred_department','Khoa chuyển'],
      ['transfer_number','Số chuyển tuyến'],['transfer_date','Ngày chuyển tuyến'],
      ['transfer_month','Tháng chuyển tuyến'],['treatment_start','Ngày điều trị từ'],
      ['treatment_end','Ngày điều trị đến'],['treatment_notes','Ghi chú điều trị'],
      ['appointment_number','Số hẹn khám'],['appointment_date','Ngày hẹn khám'],['appointment_hour','Giờ hẹn khám']
    ]],
    ['Thông tin liên hệ & giấy tờ', [
      ['contact_name','Người liên hệ'],['contact_id','CCCD người liên hệ'],['contact_phone','SĐT người liên hệ'],
      ['contact_address','Địa chỉ liên hệ'],['relationship','Mối quan hệ'],
      ['attached_document','Giấy tờ kèm theo'],['attached_document_number','Số giấy tờ kèm theo']
    ]]
  ];
  const allMappedFields = new Set(detailGroups.flatMap(g => g[1].map(f => f[0])));
  const detailDialog = document.getElementById('record-detail-dialog');
  const sourceLabel = record => record._source || 'Nhập thủ công';
  function textCell(tr, value, className='') {
    const td=document.createElement('td'); td.textContent=String(value ?? '') || '—';
    if(className) td.className=className;
    tr.appendChild(td); return td;
  }
  function actionButton(text, action, cls='') {
    const btn=document.createElement('button'); btn.type='button'; btn.textContent=text;
    if(cls) btn.className=cls;
    btn.addEventListener('click',action); return btn;
  }
  function editRecord(record) {
    editingId=record._id;
    lastScanData=null;
    assign(record);
    detailDialog.close();
    window.scrollTo({top:0,behavior:'smooth'});
    document.getElementById('full_name').focus({preventScroll:true});
    announce(`Đang chỉnh sửa hồ sơ ${record.patient_code || record.full_name}.`);
  }
  function renderRecords() {
    const query=document.getElementById('search-records').value.trim().toLocaleLowerCase('vi');
    const source=document.getElementById('filter-source').value;
    const result=records.filter(r => {
      const matchesText = [r.patient_code,r.visit_code,r.full_name,r.national_id,r.phone,r.department,r.registration_date]
        .some(v => String(v || '').toLocaleLowerCase('vi').includes(query));
      return matchesText && (!source || sourceLabel(r) === source);
    });
    document.getElementById('record-count').textContent=`(${records.length})`;
    document.getElementById('visible-count').textContent=String(result.length);
    document.getElementById('delete-all').disabled=!records.length;
    tbody.replaceChildren();
    if (!result.length) {
      const tr=document.createElement('tr');
      const td=document.createElement('td'); td.colSpan=10; td.className='empty';
      td.textContent=records.length ? 'Không tìm thấy hồ sơ phù hợp.' : 'Chưa có hồ sơ nào được lưu. Hãy quét CCCD và lưu, hoặc tạo hồ sơ mẫu.';
      tr.appendChild(td); tbody.appendChild(tr); return;
    }
    for (const [index,record] of result.entries()) {
      const tr=document.createElement('tr');
      textCell(tr,index+1); textCell(tr,record.patient_code);
      const nameCell=document.createElement('td');
      nameCell.appendChild(actionButton(record.full_name || 'Chưa có tên',()=>openDetail(record._id),'link-name'));
      tr.appendChild(nameCell);
      textCell(tr,`${record.birth_day || '--'}/${record.birth_month || '--'}/${record.birth_year || '----'}`);
      textCell(tr,record.national_id); textCell(tr,record.phone); textCell(tr,`${record.registration_date || '—'} ${record.registration_time || ''}`);
      textCell(tr,record.department);
      const tdSource=document.createElement('td');
      const spanSource=document.createElement('span'); spanSource.className='source-tag'; spanSource.textContent=sourceLabel(record);
      tdSource.appendChild(spanSource); tr.appendChild(tdSource);
      const actions=document.createElement('td'); actions.className='actions-cell';
      actions.appendChild(actionButton('Xem chi tiết',()=>openDetail(record._id),'detail-row-btn'));
      actions.appendChild(actionButton('Sửa',()=>editRecord(record)));
      actions.appendChild(actionButton('Xóa',()=>{
        records=records.filter(r => r._id!==record._id);
        if(editingId===record._id) editingId=null;
        persist(); renderRecords(); announce('Đã xóa hồ sơ.');
      },'delete-row'));
      tr.appendChild(actions); tbody.appendChild(tr);
    }
  }
  function renderDetail(record) {
    const all = document.getElementById('show-all-detail').checked;
    const container=document.getElementById('detail-content'); container.replaceChildren();
    for(const [title,fields] of detailGroups) {
      const visible=fields.filter(([id]) => all || (record[id] !== '' && record[id] !== null && record[id] !== undefined && record[id] !== false));
      if(!visible.length) continue;
      const section=document.createElement('section'); section.className='detail-group';
      const h3=document.createElement('h3'); h3.textContent=title; section.appendChild(h3);
      const dl=document.createElement('dl'); dl.className='detail-grid';
      for (const [id,label] of visible) {
        const field=document.createElement('div'); field.className='detail-field';
        const dt=document.createElement('dt'); dt.textContent=label;
        const dd=document.createElement('dd');
        const raw=record[id];
        const val=typeof raw==='boolean' ? (raw?'Có':'Không') : (raw ?? '');
        dd.textContent=String(val) || '—'; if(!val) dd.className='no-value';
        field.append(dt,dd);dl.appendChild(field);
      }
      section.appendChild(dl); container.appendChild(section);
    }
    const unmapped=Object.keys(record).filter(k=>!k.startsWith('_')&&!allMappedFields.has(k) && (all || record[k]));
    if(unmapped.length) {
      const section=document.createElement('section'); section.className='detail-group';
      const h3=document.createElement('h3'); h3.textContent='Trường bổ sung';section.appendChild(h3);
      const dl=document.createElement('dl'); dl.className='detail-grid';
      for (const key of unmapped) {
        const field=document.createElement('div'); field.className='detail-field';
        const dt=document.createElement('dt');dt.textContent=key;
        const dd=document.createElement('dd');dd.textContent=String(record[key]??'—');
        field.append(dt,dd);dl.appendChild(field);
      }
      section.appendChild(dl);container.appendChild(section);
    }
  }
  function openDetail(id) {
    const record=records.find(r=>r._id===id);
    if(!record){announce('Không tìm thấy hồ sơ.',true);return;}
    detailRecordId=id;
    document.getElementById('show-all-detail').checked=false;
    document.getElementById('detail-title').textContent=record.full_name||'Chi tiết hồ sơ';
    document.getElementById('detail-subtitle').textContent=`Mã BN: ${record.patient_code||'—'}  •  Ngày đăng ký: ${record.registration_date||'—'}  •  Nguồn: ${sourceLabel(record)}`;
    renderDetail(record);
    detailDialog.showModal();
  }
  function startNew() {
    editingId=null; lastScanData=null;
    const empty=Object.fromEntries(formElements.map(el=>[el.name,el.type==='checkbox'?false:'']));
    empty.registration_date=dateDMY(today());
    empty.registration_time=timeHM(today());
    empty.patient_group='Khám sức khỏe TT25';
    empty.examination_type=sample.examination_type;
    empty.kcb_type=sample.kcb_type;
    empty.arrival_method='Tự đến';
    assign(empty);
    document.getElementById('full_name').focus();
    announce('Form đã được làm trống để nhập hồ sơ mới.');
  }
  function csvCell(value) {
    let str=String(value==null?'':value);
    if (/^[=+\-@]/.test(str)) str=`'${str}`; // ngăn thực thi công thức CSV
    return `"${str.replaceAll('"','""')}"`;
  }
  function download(filename,mime,content) {
    const blob=new Blob([content],{type:mime}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=filename;
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),3000);
  }
  form.addEventListener('submit',event=>{
    event.preventDefault();
    const data=values();
    if(!validate(data))return;
    const nowIso=new Date().toISOString();
    let wasEditing=false;
    if(editingId) {
      const index=records.findIndex(r=>r._id===editingId);
      if(index!==-1) {
        records[index]={...records[index],...data,_updatedAt:nowIso, _source:lastScanData?'Quét CCCD giả lập':sourceLabel(records[index])};
        wasEditing=true;
      }
    }
    if(!wasEditing)records.unshift({...data,_id:createId(),_source:lastScanData?'Quét CCCD giả lập':'Nhập thủ công',_createdAt:nowIso});
    editingId=null;lastScanData=null;
    persist();renderRecords();
    announce(wasEditing?'Đã cập nhật hồ sơ. Mở “Xem chi tiết” để kiểm tra.':'Đã lưu hồ sơ mới vào danh sách đăng ký. Mở “Xem chi tiết” để kiểm tra.');
  });
  document.getElementById('patient_group').addEventListener('change',applyInsuranceState);
  document.getElementById('arrival_method').addEventListener('change',applyReferralState);
  ['birth_day','birth_month','birth_year'].forEach(id=>document.getElementById(id).addEventListener('input',updateAge));
  document.getElementById('new-record').addEventListener('click',startNew);
  document.getElementById('reset-demo').addEventListener('click',()=>{
    editingId=null;lastScanData=null;assign(sample);
    announce('Đã khôi phục các giá trị mẫu theo ảnh tham chiếu.');
  });
  const scan=()=>fillFromScan(makeMockPerson());
  document.getElementById('scan-cccd').addEventListener('click',scan);
  document.getElementById('scan-shortcut').addEventListener('click',scan);
  document.getElementById('generate-records').addEventListener('click',()=>{
    const created=[];
    for(let i=0;i<10;i++) {
      const item=makeSyntheticRecord();
      while(created.some(r=>r.national_id===item.national_id) || records.some(r=>r.national_id===item.national_id)) item.national_id=`999${randomDigits(9)}`;
      created.push(item);
    }
    records.unshift(...created);
    persist();renderRecords();
    document.getElementById('registration-list').scrollIntoView({behavior:'smooth',block:'start'});
    announce('Đã tạo và lưu 10 hồ sơ mẫu ngẫu nhiên.');
  });
  document.getElementById('delete-all').addEventListener('click',()=>{
    if (!records.length || !window.confirm(`Xóa toàn bộ ${records.length} hồ sơ đã lưu, kể cả hồ sơ đang bị lọc?`)) return;
    records=[]; editingId=null; detailRecordId=null;
    if (detailDialog.open) detailDialog.close();
    persist(); renderRecords(); announce('Đã xóa toàn bộ hồ sơ.');
  });
  document.getElementById('search-records').addEventListener('input',renderRecords);
  document.getElementById('filter-source').addEventListener('change',renderRecords);
  document.getElementById('close-detail').addEventListener('click',()=>detailDialog.close());
  document.getElementById('close-detail-footer').addEventListener('click',()=>detailDialog.close());
  document.getElementById('show-all-detail').addEventListener('change',()=>{
    const rec=records.find(r=>r._id===detailRecordId);if(rec)renderDetail(rec);
  });
  document.getElementById('edit-from-detail').addEventListener('click',()=>{
    const rec=records.find(r=>r._id===detailRecordId);if(rec)editRecord(rec);
  });
  document.getElementById('download-one').addEventListener('click',()=>{
    const rec=records.find(r=>r._id===detailRecordId);
    if(rec)download(`ho-so-demo-${rec.patient_code||'benh-nhan'}.json`,'application/json;charset=utf-8',JSON.stringify(rec,null,2));
  });
  document.getElementById('export-json').addEventListener('click',()=>{
    if(!records.length){announce('Chưa có hồ sơ để xuất.',true);return;}
    download('dang-ky-kham-chua-benh-demo.json','application/json;charset=utf-8',JSON.stringify(records,null,2));
    announce(`Đã xuất ${records.length} hồ sơ dạng JSON.`);
  });
  document.getElementById('export-csv').addEventListener('click',()=>{
    if(!records.length){announce('Chưa có hồ sơ để xuất.',true);return;}
    const keys=[...new Set(records.flatMap(r=>Object.keys(r)))].filter(k=>k!=='_id');
    const rows=[keys.map(csvCell).join(','),...records.map(r=>keys.map(k=>csvCell(r[k])).join(','))];
    download('dang-ky-kham-chua-benh-demo.csv','text/csv;charset=utf-8','\uFEFF'+rows.join('\r\n'));
    announce(`Đã xuất ${records.length} hồ sơ dạng CSV.`);
  });

  // Đọc dữ liệu phiên bản trước. Lần mở đầu tiên có sẵn tám hồ sơ hoàn toàn giả lập
  // để người dùng thử ngay chức năng xem chi tiết. Nếu người dùng đã xóa hết hồ sơ
  // thì không tự tạo lại trong những lần mở sau.
  try {
    const stored=localStorage.getItem(STORAGE_KEY);
    if(stored===null) {
      records=Array.from({length:8},()=>makeSyntheticRecord());
      persist();
    } else {
      const saved=JSON.parse(stored);
      records=Array.isArray(saved)?saved:[];
    }
  } catch {
    // Trong môi trường chặn localStorage, vẫn cho phép thử tất cả tính năng trong phiên.
    records=Array.from({length:8},()=>makeSyntheticRecord());
  }
  applyInsuranceState();applyReferralState();updateAge();renderRecords();
})();
