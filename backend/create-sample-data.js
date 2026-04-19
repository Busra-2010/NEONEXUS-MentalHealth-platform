const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { randomUUID } = require('crypto');

const dbPath = './data/neonexus.sqlite';

console.log('🗄️ Creating sample data for NEONEXUS platform...\n');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    return;
  }
  console.log('✅ Connected to SQLite database');
});

// Sample data - using correct schema structure
const sampleUsers = [
  {
    email: 'student1@university.edu',
    username: 'anita_student',
    password: '$2a$10$XqJ3k.ZrYON0HLN5kN3Kz.7G6mFn8Cx8Kj9V.Qw7E8R9T.1Y2U3V4', // hashedpassword123
    full_name: 'Anita Sharma',
    role: 'student',
    institution_id: 'UNIV001',
    year: 2,
    department: 'Computer Science'
  },
  {
    email: 'counselor1@university.edu',
    username: 'priya_counselor',
    password: '$2a$10$XqJ3k.ZrYON0HLN5kN3Kz.7G6mFn8Cx8Kj9V.Qw7E8R9T.1Y2U3V4',
    full_name: 'Dr. Priya Mehta',
    role: 'counselor',
    institution_id: 'UNIV001',
    specialization: 'Anxiety, Depression, Academic Stress'
  }
];

const sampleCategories = [
  {
    id: 1,
    name: 'Academic Stress',
    description: 'Discussions about study pressure, exams, and academic challenges',
    color: '#3B82F6',
    is_anonymous_only: 1,
    display_order: 1,
    is_active: 1
  },
  {
    id: 2,
    name: 'Anxiety & Worry',
    description: 'Share experiences and coping strategies for anxiety',
    color: '#EF4444',
    is_anonymous_only: 1,
    display_order: 2,
    is_active: 1
  },
  {
    id: 3,
    name: 'Depression Support',
    description: 'Peer support for those dealing with depression',
    color: '#8B5CF6',
    is_anonymous_only: 1,
    display_order: 3,
    is_active: 1
  },
  {
    id: 4,
    name: 'Relationships',
    description: 'Discussing friendship, family, and romantic relationship challenges',
    color: '#F59E0B',
    is_anonymous_only: 0,
    display_order: 4,
    is_active: 1
  }
];

// We'll create posts after inserting users to get their IDs
let insertedUserIds = [];

// Insert data with correct schema
async function insertSampleData() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Insert users
      console.log('👥 Inserting sample users...');
      const userStmt = db.prepare(`
        INSERT OR IGNORE INTO users (
          username, email, password_hash, role, institution_id, is_active, is_verified
        ) VALUES (?, ?, ?, ?, ?, 1, 1)
      `);
      
      sampleUsers.forEach(user => {
        userStmt.run([
          user.username, user.email, user.password, user.role, user.institution_id
        ], function(err) {
          if (!err && this.lastID) {
            insertedUserIds.push({ id: this.lastID, ...user });
          }
        });
      });
      userStmt.finalize(() => {
        
        // Insert user profiles
        console.log('👤 Inserting user profiles...');
        const profileStmt = db.prepare(`
          INSERT OR IGNORE INTO user_profiles (user_id, full_name) VALUES (?, ?)
        `);
        
        insertedUserIds.forEach((user, index) => {
          profileStmt.run([user.id, sampleUsers[index].full_name]);
        });
        profileStmt.finalize(() => {
          
          // Insert student profiles
          console.log('🎓 Inserting student profiles...');
          const studentStmt = db.prepare(`
            INSERT OR IGNORE INTO student_profiles (
              user_id, year_of_study, department, preferences_notifications, preferences_anonymous_mode
            ) VALUES (?, ?, ?, 1, 1)
          `);
          
          insertedUserIds.forEach((user, index) => {
            if (sampleUsers[index].role === 'student') {
              studentStmt.run([user.id, sampleUsers[index].year, sampleUsers[index].department]);
            }
          });
          studentStmt.finalize();
          
          // Insert categories
          console.log('📂 Inserting forum categories...');
          const categoryStmt = db.prepare(`
            INSERT OR IGNORE INTO forum_categories (
              id, name, description, color, is_anonymous_only, 
              display_order, is_active, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `);
          
          sampleCategories.forEach(category => {
            categoryStmt.run([
              category.id, category.name, category.description, category.color,
              category.is_anonymous_only, category.display_order, category.is_active
            ]);
          });
          categoryStmt.finalize(() => {
            
            // Insert sample posts
            if (insertedUserIds.length > 0) {
              console.log('📝 Inserting sample forum posts...');
              const postStmt = db.prepare(`
                INSERT OR IGNORE INTO forum_posts (
                  id, category_id, user_id, title, content, is_anonymous,
                  has_crisis_indicators, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              `);
              
              const samplePosts = [
                {
                  id: randomUUID(),
                  category_id: 1,
                  user_id: insertedUserIds[0].id,
                  title: 'Struggling with Final Exams',
                  content: 'I am feeling overwhelmed with my final exams coming up. The pressure is intense and I can barely sleep. Has anyone else felt this way? How did you cope?',
                  is_anonymous: 1,
                  has_crisis_indicators: 0,
                  status: 'published'
                },
                {
                  id: randomUUID(),
                  category_id: 2,
                  user_id: insertedUserIds[0].id,
                  title: 'Social Anxiety in Group Projects',
                  content: 'I get really anxious when I have to work in groups or present in front of the class. My heart races and I feel like everyone is judging me. Any tips for managing this?',
                  is_anonymous: 1,
                  has_crisis_indicators: 0,
                  status: 'published'
                }
              ];
              
              samplePosts.forEach(post => {
                postStmt.run([
                  post.id, post.category_id, post.user_id, post.title,
                  post.content, post.is_anonymous, post.has_crisis_indicators, post.status
                ]);
              });
              postStmt.finalize(() => {
                
                console.log('\n✅ Sample data inserted successfully!');
                console.log('📊 Summary:');
                console.log(`   - ${sampleUsers.length} users with profiles`);
                console.log(`   - ${sampleCategories.length} forum categories`);
                console.log(`   - 2 forum posts`);
                console.log('\n🔐 Test Login Credentials:');
                console.log('   Student: student1@university.edu / password123');
                console.log('   Counselor: counselor1@university.edu / password123');
                
                resolve();
              });
            } else {
              resolve();
            }
          });
        });
      });
    });
  });
}

// Run the data insertion
insertSampleData()
  .then(() => {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err);
      } else {
        console.log('\n✅ Database connection closed.');
        console.log('🚀 Ready to test API endpoints!');
      }
    });
  })
  .catch(err => {
    console.error('❌ Error inserting sample data:', err);
  });