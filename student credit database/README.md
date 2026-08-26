# 📚 Students Care Model School - Database Integration Documentation

আপনার হোস্ট করা লাইভ ওয়েবসাইট (`studentscaremodelschool.com`) থেকে Hostinger MySQL ডাটাবেজে স্টুডেন্ট ডাটা পাঠানো ও ব্যবস্থাপনার জন্য সমস্ত PHP ব্যাকএন্ড ফাইল এই ফোল্ডারে প্রস্তুত করে রাখা হয়েছে।

---

## 📁 ফোল্ডারের ফাইল তালিকা:

1. **`db.php`**  
   - আপনার Hostinger MySQL ক্রেডেনশিয়াল দিয়ে ডাটাবেজ কানেকশন কনফিগারেশন:
     - **Database:** `u451653929_StudentsCare`
     - **User:** `u451653929_admin`
     - **Password:** `Cisfa1998$#@`
     - **Host:** `localhost`
     - **Charset:** `utf8mb4` (বাংলা লেখার জন্য শতভাগ সুরক্ষিত)

2. **`insert_student.php`**  
   - লাইভ ওয়েবসাইট থেকে স্টুডেন্ট অ্যাড বা এডমিশন ফর্ম সাবমিট করার এপিআই।
   - ছবি আপলোড ও এসকিউএল ইনজেকশন প্রোটেকশন যুক্ত।

3. **`get_students.php`**  
   - ডাটাবেজ থেকে সকল স্টুডেন্টের তালিকা, সার্চ, ফিল্টারিং (Class, Section, Session) অনুযায়ী ফেচ করার এপিআই।

4. **`update_student.php`**  
   - স্টুডেন্টের তথ্য এডিট/আপডেট করার এপিআই।

5. **`delete_student.php`**  
   - কোনো স্টুডেন্ট রেকর্ড ডিলিট করার এপিআই।

6. **`schema.sql`**  
   - `students` টেবিল তৈরির জন্য সম্পূর্ণ SQL স্ক্রিপ্ট।

---

## 🚀 সেটআপ ও ব্যবহারের নিয়ম:

### ধাপ ১: Hostinger phpMyAdmin-এ টেবিল তৈরি করুন
1. Hostinger **Databases** পেজ থেকে **"Enter phpMyAdmin"** বাটনে ক্লিক করুন।
2. বাঁপাশের ডাটাবেজ `u451653929_StudentsCare` সিলেক্ট করুন।
3. **SQL** ট্যাবে ক্লিক করে এই ফোল্ডারের **`schema.sql`**-এর কোডটি পেস্ট করে **Go** চাপুন।

### ধাপ ২: ফ্রন্টএন্ড/ওয়েবসাইট থেকে ডাটা পাঠানোর API কল:

```javascript
// Example: New Student Registration
const newStudent = {
  name: "Tanvir Rahman",
  name_bn: "তানভীর রহমান",
  roll: "01",
  class_name: "Class 6",
  section: "A",
  shift: "Morning",
  gender: "Male",
  blood_group: "B+",
  dob: "2012-05-15",
  father_name: "Abdur Rahman",
  mother_name: "Taslima Begum",
  guardian_phone: "01711000001",
  present_address: "Dhaka, Bangladesh",
  session_year: "2026"
};

fetch('https://studentscaremodelschool.com/insert.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newStudent)
})
.then(res => res.json())
.then(data => {
  if (data.status === 'success') {
    alert("স্টুডেন্ট ডাটাবেজে সফলভাবে সংরক্ষিত হয়েছে! আইডি: " + data.student_id);
  } else {
    alert("এরর: " + data.message);
  }
});
```
