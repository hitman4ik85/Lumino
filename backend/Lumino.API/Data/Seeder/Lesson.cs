using System.Text.Json;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Domain.Enums;

namespace Lumino.Api.Data.Seeder
{
    public static class LessonSeederData
    {
        public static List<CourseSeed> GetCourses()
        {
            return new List<CourseSeed>
            {
                new CourseSeed("English A1", "Basics: greetings, numbers, travel, simple phrases", "en", true, "A1", 1),
                new CourseSeed("English A2", "Elementary: daily life, shopping, simple dialogs", "en", true, "A2", 2),
                new CourseSeed("English B1", "Intermediate: work, travel, opinions, longer texts", "en", true, "B1", 3),
                new CourseSeed("English B2", "Upper-intermediate: complex topics, fluency practice", "en", true, "B2", 4),
                new CourseSeed("English C1", "Advanced: academic and professional communication", "en", true, "C1", 5)
            };
        }

        public static List<Scene> GetScenes()
        {
            var scenes = new List<Scene>
                        {
                            new Scene
                            {
                                Title = "Cafe order",
                                Description = "Order a coffee in a cafe",
                                SceneType = "Dialog",
                                BackgroundUrl = null,
                                AudioUrl = null,
                                Order = 1
                            },
                            new Scene
                            {
                                Title = "Airport check-in",
                                Description = "Check in for your flight",
                                SceneType = "Dialog",
                                BackgroundUrl = null,
                                AudioUrl = null,
                                Order = 2
                            },
                            new Scene
                            {
                                Title = "Hotel booking",
                                Description = "Book a room at a hotel reception",
                                SceneType = "Dialog",
                                BackgroundUrl = null,
                                AudioUrl = null,
                                Order = 3
                            },
                            new Scene
                            {
                                Title = "Asking directions",
                                Description = "Ask how to get to a place in the city",
                                SceneType = "Dialog",
                                BackgroundUrl = null,
                                AudioUrl = null,
                                Order = 4
                            },
                            new Scene
                            {
                                Title = "Shopping",
                                Description = "Buy something in a store and ask the price",
                                SceneType = "Dialog",
                                BackgroundUrl = null,
                                AudioUrl = null,
                                Order = 5
                            },
                            new Scene
                            {
                                Title = "Small talk",
                                Description = "Introduce yourself and keep a short conversation",
                                SceneType = "Dialog",
                                BackgroundUrl = null,
                                AudioUrl = null,
                                Order = 6
                            },
                            new Scene
                            {
                                Title = "Restaurant reservation",
                                Description = "Reserve a table at a restaurant",
                                SceneType = "Dialog",
                                BackgroundUrl = null,
                                AudioUrl = null,
                                Order = 7
                            },
                            new Scene
                            {
                                Title = "Doctor visit",
                                Description = "Describe your symptoms at a doctor",
                                SceneType = "Dialog",
                                BackgroundUrl = null,
                                AudioUrl = null,
                                Order = 8
                            },
                            new Scene
                            {
                                Title = "Public transport",
                                Description = "Buy a ticket and ask about the bus",
                                SceneType = "Dialog",
                                BackgroundUrl = null,
                                AudioUrl = null,
                                Order = 9
                            },
                            new Scene
                            {
                                Title = "Job interview",
                                Description = "Answer basic questions in an interview",
                                SceneType = "Dialog",
                                BackgroundUrl = null,
                                AudioUrl = null,
                                Order = 10
                            }
                        };

            return scenes;
        }

        public static Dictionary<string, List<SceneStepSeed>> GetSceneStepsBySceneTitle()
        {
            var stepsBySceneTitle = new Dictionary<string, List<SceneStepSeed>>(StringComparer.OrdinalIgnoreCase)
            {
                ["Cafe order"] = new List<SceneStepSeed>
                            {
                                new SceneStepSeed(1, "Barista", "Hi! What would you like?", "Line", null, null),
                                new SceneStepSeed(2, "You", "I'd like a coffee, please.", "Line", null, null),
                                new SceneStepSeed(3, "Quiz", "What did you order?", "Choice", null, "[{\"text\": \"Coffee\", \"isCorrect\": true}, {\"text\": \"Tea\", \"isCorrect\": false}, {\"text\": \"Water\", \"isCorrect\": false}]"),
                                new SceneStepSeed(4, "Barista", "Sure. Anything else?", "Line", null, null),
                                new SceneStepSeed(5, "Quiz", "Do you want anything else?", "Choice", null, "[{\"text\": \"No\", \"isCorrect\": true}, {\"text\": \"Yes\", \"isCorrect\": false}]"),
                                new SceneStepSeed(6, "Quiz", "Type: Thank you", "Input", null, "{\"correctAnswer\": \"Thank you\", \"acceptableAnswers\": [\"Thanks\", \"Thanks!\"]}")
                            },
                ["Airport check-in"] = new List<SceneStepSeed>
                            {
                                new SceneStepSeed(1, "Staff", "Hello. Can I see your passport?", "Line", null, null),
                                new SceneStepSeed(2, "You", "Yes, here you go.", "Line", null, null),
                                new SceneStepSeed(3, "Quiz", "Type the key word: passport", "Input", null, "{\"correctAnswer\": \"passport\", \"acceptableAnswers\": [\"my passport\"]}"),
                                new SceneStepSeed(4, "Staff", "Do you have any luggage?", "Line", null, null),
                                new SceneStepSeed(5, "Quiz", "How many bags do you have?", "Choice", null, "[{\"text\": \"One small bag\", \"isCorrect\": true}, {\"text\": \"Three suitcases\", \"isCorrect\": false}, {\"text\": \"None\", \"isCorrect\": false}]"),
                                new SceneStepSeed(6, "You", "Just a small bag.", "Line", null, null)
                            },
                ["Hotel booking"] = new List<SceneStepSeed>
                            {
                                new SceneStepSeed(1, "Receptionist", "Hello! Do you have a reservation?", "Line", null, null),
                                new SceneStepSeed(2, "Quiz", "What does \"reservation\" mean here?", "Choice", null, "[{\"text\": \"Booking\", \"isCorrect\": true}, {\"text\": \"Restaurant\", \"isCorrect\": false}, {\"text\": \"Passport\", \"isCorrect\": false}]"),
                                new SceneStepSeed(3, "You", "Yes, it's under my name.", "Line", null, null),
                                new SceneStepSeed(4, "Quiz", "Type: key", "Input", null, "{\"correctAnswer\": \"key\", \"acceptableAnswers\": [\"room key\"]}"),
                                new SceneStepSeed(5, "Receptionist", "Great. Here is your key.", "Line", null, null),
                                new SceneStepSeed(6, "You", "Thank you!", "Line", null, null)
                            },
                ["Asking directions"] = new List<SceneStepSeed>
                            {
                                new SceneStepSeed(1, "You", "Excuse me, where is the station?", "Line", null, null),
                                new SceneStepSeed(2, "Quiz", "Where do you want to go?", "Choice", null, "[{\"text\": \"To the station\", \"isCorrect\": true}, {\"text\": \"To the hotel\", \"isCorrect\": false}, {\"text\": \"To the airport\", \"isCorrect\": false}]"),
                                new SceneStepSeed(3, "Person", "Go straight and turn left.", "Line", null, null),
                                new SceneStepSeed(4, "Quiz", "Type: left", "Input", null, "{\"correctAnswer\": \"left\", \"acceptableAnswers\": [\"turn left\"]}"),
                                new SceneStepSeed(5, "You", "Thanks a lot!", "Line", null, null),
                                new SceneStepSeed(6, "Person", "You're welcome.", "Line", null, null)
                            },
                ["Shopping"] = new List<SceneStepSeed>
                            {
                                new SceneStepSeed(1, "You", "How much is this?", "Line", null, null),
                                new SceneStepSeed(2, "Seller", "It's ten dollars.", "Line", null, null),
                                new SceneStepSeed(3, "Quiz", "How much is it?", "Choice", null, "[{\"text\": \"Ten dollars\", \"isCorrect\": true}, {\"text\": \"Five dollars\", \"isCorrect\": false}, {\"text\": \"Twenty dollars\", \"isCorrect\": false}]"),
                                new SceneStepSeed(4, "You", "That's cheap! I'll take it.", "Line", null, null),
                                new SceneStepSeed(5, "Quiz", "Type: I'll take it", "Input", null, "{\"correctAnswer\": \"I'll take it\", \"acceptableAnswers\": [\"I will take it\"]}"),
                                new SceneStepSeed(6, "Seller", "Great choice!", "Line", null, null)
                            },
                ["Small talk"] = new List<SceneStepSeed>
                            {
                                new SceneStepSeed(1, "You", "Hi! My name is Alex.", "Line", null, null),
                                new SceneStepSeed(2, "Person", "Nice to meet you, Alex!", "Line", null, null),
                                new SceneStepSeed(3, "Quiz", "What is your name?", "Choice", null, "[{\"text\": \"Alex\", \"isCorrect\": true}, {\"text\": \"John\", \"isCorrect\": false}, {\"text\": \"Kate\", \"isCorrect\": false}]"),
                                new SceneStepSeed(4, "Quiz", "Type: Nice to meet you", "Input", null, "{\"correctAnswer\": \"Nice to meet you\", \"acceptableAnswers\": [\"Nice to meet you!\"]}"),
                                new SceneStepSeed(5, "You", "Nice to meet you too.", "Line", null, null),
                                new SceneStepSeed(6, "Person", "How are you?", "Line", null, null)
                            },
                ["Restaurant reservation"] = new List<SceneStepSeed>
                            {
                                new SceneStepSeed(1, "Host", "Hello! Do you have a reservation?", "Line", null, null),
                                new SceneStepSeed(2, "You", "Yes, a table for two, please.", "Line", null, null),
                                new SceneStepSeed(3, "Quiz", "How many people?", "Choice", null, "[{\"text\": \"Two\", \"isCorrect\": true}, {\"text\": \"Five\", \"isCorrect\": false}, {\"text\": \"One\", \"isCorrect\": false}]"),
                                new SceneStepSeed(4, "Host", "Great. What time would you like?", "Line", null, null),
                                new SceneStepSeed(5, "Quiz", "Type: at seven", "Input", null, "{\"correctAnswer\": \"at seven\", \"acceptableAnswers\": [\"7 pm\", \"at 7\"]}"),
                                new SceneStepSeed(6, "You", "At seven, thank you.", "Line", null, null)
                            },
                ["Doctor visit"] = new List<SceneStepSeed>
                            {
                                new SceneStepSeed(1, "Doctor", "Hello. What seems to be the problem?", "Line", null, null),
                                new SceneStepSeed(2, "You", "I have a headache.", "Line", null, null),
                                new SceneStepSeed(3, "Quiz", "What do you have?", "Choice", null, "[{\"text\": \"A headache\", \"isCorrect\": true}, {\"text\": \"A ticket\", \"isCorrect\": false}, {\"text\": \"A coffee\", \"isCorrect\": false}]"),
                                new SceneStepSeed(4, "Doctor", "How long have you had it?", "Line", null, null),
                                new SceneStepSeed(5, "Quiz", "Type: two days", "Input", null, "{\"correctAnswer\": \"two days\", \"acceptableAnswers\": [\"2 days\", \"for two days\"]}"),
                                new SceneStepSeed(6, "Doctor", "Ok. Please rest and drink water.", "Line", null, null)
                            },
                ["Public transport"] = new List<SceneStepSeed>
                            {
                                new SceneStepSeed(1, "You", "Excuse me, where can I buy a ticket?", "Line", null, null),
                                new SceneStepSeed(2, "Staff", "You can buy it here.", "Line", null, null),
                                new SceneStepSeed(3, "Quiz", "Where can you buy a ticket?", "Choice", null, "[{\"text\": \"Here\", \"isCorrect\": true}, {\"text\": \"At the hotel\", \"isCorrect\": false}, {\"text\": \"At the cafe\", \"isCorrect\": false}]"),
                                new SceneStepSeed(4, "Staff", "One-way or return?", "Line", null, null),
                                new SceneStepSeed(5, "Quiz", "Type: one-way", "Input", null, "{\"correctAnswer\": \"one-way\", \"acceptableAnswers\": [\"one way\"]}"),
                                new SceneStepSeed(6, "You", "One-way, please.", "Line", null, null)
                            },
                ["Job interview"] = new List<SceneStepSeed>
                            {
                                new SceneStepSeed(1, "Interviewer", "Welcome. Can you tell me about yourself?", "Line", null, null),
                                new SceneStepSeed(2, "You", "I'm a student and I like learning languages.", "Line", null, null),
                                new SceneStepSeed(3, "Quiz", "Who are you?", "Choice", null, "[{\"text\": \"A student\", \"isCorrect\": true}, {\"text\": \"A pilot\", \"isCorrect\": false}, {\"text\": \"A doctor\", \"isCorrect\": false}]"),
                                new SceneStepSeed(4, "Interviewer", "Why do you want this job?", "Line", null, null),
                                new SceneStepSeed(5, "Quiz", "Type: I want to grow", "Input", null, "{\"correctAnswer\": \"I want to grow\", \"acceptableAnswers\": [\"I want to improve\", \"I want to learn\"]}"),
                                new SceneStepSeed(6, "Interviewer", "Great. Thank you for coming.", "Line", null, null)
                            }
            };

            return stepsBySceneTitle;
        }

        public static List<TopicSeed> GetTopics()
        {
            var topics = new List<TopicSeed>
                        {
                            new TopicSeed("Basic words", 1),
                            new TopicSeed("Simple sentences", 2),
                            new TopicSeed("Travel", 3),
                            new TopicSeed("Food & Cafe", 4),
                        };

            return topics;
        }

        public static List<LessonSeed> GetLessons(Dictionary<string, Topic> topicMap)
        {
            var lessons = new List<LessonSeed>
                        {
                            new LessonSeed(topicMap["Basic words"].Id, "Lesson 1",
                                "sister = сестра\nbook = книжка\ntable = стіл\nmother = мама\napple = яблуко\nhouse = будинок\npen = ручка\nsun = сонце\nzoo = зоопарк\nfriend = друг\ncat = кіт\nhat = шапка\nchair = стілець\nteacher = вчитель\ndog = собака\nschool = школа\nmilk = молоко", 1),
                            new LessonSeed(topicMap["Basic words"].Id, "Lesson 2",
                                "red = червоний\nwater = вода\nbread = хліб\nopen = відкривати\nstory = історія\nwindow = вікно\ndoor = двері\nbed = ліжко\ncup = чашка\nbird = птах\nfish = риба\nplay = грати", 2),
                            new LessonSeed(topicMap["Basic words"].Id, "Lesson 3",
                                "floor = підлога\nwall = стіна\nplate = тарілка\nspoon = ложка\nfork = виделка\nbag = сумка\nbox = коробка\nphone = телефон\nkey = ключ", 3),
                            new LessonSeed(topicMap["Basic words"].Id, "Lesson 4",
                                "bus = автобус\ncar = машина\nbike = велосипед\ntrain = поїзд", 4),
                            new LessonSeed(topicMap["Basic words"].Id, "Lesson 5",
                                "run = бігати\neat = їсти\ndrink = пити\nsleep = спати\nread = читати\nwrite = писати\nclose = закривати\nwalk = йти\nsit = сидіти\nstand = стояти\nlook = дивитися", 5),
                            new LessonSeed(topicMap["Basic words"].Id, "Lesson 6",
                                "happy = щасливий\nbig = великий\nsmall = малий\nhot = гарячий\ncold = холодний\ngood = добрий\nbad = поганий\nnew = новий\nold = старий\ntired = втомлений\nsad = сумний\nangry = злий", 6),
                            new LessonSeed(topicMap["Basic words"].Id, "Lesson 7",
                                "on = на\nin = в\nunder = під\nnear = біля\nhere = тут\nthere = там\nleft = ліворуч\nright = праворуч\nabove = над\nbelow = під\ninside = всередині\noutside = ззовні", 7),
                            new LessonSeed(topicMap["Basic words"].Id, "Lesson 8",
                                "wake up = прокидатися\ngo = йти\ncome = приходити\nwork = працювати\nmorning = ранок\nday = день\nevening = вечір\nnight = ніч", 8),
                            new LessonSeed(topicMap["Simple sentences"].Id, "Present Simple: I / you",
                                "У цьому уроці немає нових слів", 1),
                            new LessonSeed(topicMap["Simple sentences"].Id, "Present Simple: he / she",
                                "drinks = п’є\neats = їсть\nreads = читає\nplays = грає\nruns = біжить\nworks = працює\nsleeps = спить\ngoes = йде\ncomes = приходить", 2),
                            new LessonSeed(topicMap["Simple sentences"].Id, "Negative: I / you — don’t",
                                "don’t = не (скорочення від do not)", 3),
                            new LessonSeed(topicMap["Simple sentences"].Id, "Negative: he / she — doesn’t",
                                "doesn’t = не (скорочення від does not)", 4),
                            new LessonSeed(topicMap["Simple sentences"].Id, "Questions: Do you…?",
                                "do = допоміжне дієслово (для питань)", 5),
                            new LessonSeed(topicMap["Simple sentences"].Id, "Short answers: Yes / No",
                                "У цьому уроці немає нових слів", 6),
                            new LessonSeed(topicMap["Simple sentences"].Id, "Questions: Does he / she…?",
                                "does = допоміжне дієслово (для питань з he/she/it)", 7),
                            new LessonSeed(topicMap["Simple sentences"].Id, "Short answers: he / she",
                                "У цьому уроці немає нових слів", 8),
                            new LessonSeed(topicMap["Travel"].Id, "At the airport",
                                "Airport = Аеропорт\nTicket = Квиток\nPassport = Паспорт\nWhere is the gate? = Де вихід?", 1),
                            new LessonSeed(topicMap["Travel"].Id, "Asking directions",
                                "Where is ...? = Де ...?\nTurn left/right = Поверніть ліворуч/праворуч\nGo straight = Йдіть прямо", 2),
                            new LessonSeed(topicMap["Food & Cafe"].Id, "In a cafe",
                                "Coffee = Кава\nTea = Чай\nMenu = Меню\nBill = Рахунок", 1),
                            new LessonSeed(topicMap["Food & Cafe"].Id, "How much is it?",
                                "How much is it? = Скільки коштує?\nIt is ... = Це коштує ...\nCheap/Expensive = Дешево/Дорого", 2),
                        };

            return lessons;
        }

        public static List<LessonExerciseSeed> GetLessonExercises()
        {
            return new List<LessonExerciseSeed>
            {
                new LessonExerciseSeed
                (
                    "Basic words",
                    "Lesson 1",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "сестра", ToJsonStringArray("sister", "book", "table"), "sister", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("mother", "мама"),
                    ("book", "книжка"),
                    ("apple", "яблуко"),
                    ("house", "будинок")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "She ___ my mother.", "{}", "is", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "I go to the ___ .", ToJsonStringArray("pen", "sun", "zoo"), "zoo", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("pen", "ручка"),
                    ("table", "стіл"),
                    ("friend", "друг"),
                    ("cat", "кіт")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "This is a ____ . (Це шапка)", "{}", "hat", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "It is a ___ .", ToJsonStringArray("sister", "chair", "teacher"), "chair", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("dog", "собака"),
                    ("chair", "стілець"),
                    ("school", "школа"),
                    ("milk", "молоко")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "This is a ____ . (Це книжка)", "{}", "book", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Basic words",
                    "Lesson 2",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "червоний", ToJsonStringArray("have", "morning", "red"), "red", 1, "/uploads/lessons/red.png"),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("water", "вода"),
                    ("bread", "хліб"),
                    ("milk", "молоко"),
                    ("apple", "яблуко")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "____ the window, please. (Відчини вікно, будь ласка)", "{}", "Open", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "He told us an interesting ____ .", ToJsonStringArray("fine", "story", "bear"), "story", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("window", "вікно"),
                    ("door", "двері"),
                    ("bed", "ліжко"),
                    ("cup", "чашка")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "I ate one ____ today. (Я з’їв одне яблуко сьогодні)", "{}", "apple", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "This cat ran into the ____ .", ToJsonStringArray("house", "like", "four"), "house", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("dog", "собака"),
                    ("cat", "кіт"),
                    ("bird", "птах"),
                    ("fish", "риба")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "Let's ____ football!", "{}", "play", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Basic words",
                    "Lesson 3",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "вікно", ToJsonStringArray("window", "sister", "teacher"), "window", 1, "/uploads/lessons/window.webp"),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("door", "двері"),
                    ("window", "вікно"),
                    ("floor", "підлога"),
                    ("wall", "стіна")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "It ___ a door.", "{}", "is", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "I see a ___ .", ToJsonStringArray("cup", "mother", "teacher"), "cup", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("cup", "чашка"),
                    ("plate", "тарілка"),
                    ("spoon", "ложка"),
                    ("fork", "виделка")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "This is a ____ . (Це тарілка)", "{}", "plate", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "It is a ___ .", ToJsonStringArray("bag", "brother", "friend"), "bag", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("bag", "сумка"),
                    ("box", "коробка"),
                    ("phone", "телефон"),
                    ("key", "ключ")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "This is a ____ . (Це ключ)", "{}", "key", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Basic words",
                    "Lesson 4",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "собака", ToJsonStringArray("dog", "table", "chair"), "dog", 1, "/uploads/lessons/dog.png"),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("dog", "собака"),
                    ("cat", "кіт"),
                    ("bird", "птах"),
                    ("fish", "риба")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "It ___ a cat.", "{}", "is", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "I have a ___ .", ToJsonStringArray("apple", "sister", "teacher"), "apple", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("apple", "яблуко"),
                    ("bread", "хліб"),
                    ("milk", "молоко"),
                    ("water", "вода")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "I have a ____ . (У мене є яблуко)", "{}", "apple", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "This is a ___ .", ToJsonStringArray("bus", "mother", "teacher"), "bus", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("car", "машина"),
                    ("bus", "автобус"),
                    ("bike", "велосипед"),
                    ("train", "поїзд")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "This is a ____ . (Це машина)", "{}", "car", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Basic words",
                    "Lesson 5",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "бігати", ToJsonStringArray("run", "table", "sister"), "run", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("run", "бігати"),
                    ("eat", "їсти"),
                    ("drink", "пити"),
                    ("sleep", "спати")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I ___ water.", "{}", "drink", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "I ___ an apple.", ToJsonStringArray("eat", "chair", "window"), "eat", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("read", "читати"),
                    ("write", "писати"),
                    ("open", "відкривати"),
                    ("close", "закривати")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "Please ___ the door. (Відчини двері)", "{}", "open", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "I ___ at night.", ToJsonStringArray("sleep", "table", "milk"), "sleep", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("walk", "йти"),
                    ("sit", "сидіти"),
                    ("stand", "стояти"),
                    ("look", "дивитися")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "I ___ a book. (Я читаю книгу)", "{}", "read", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Basic words",
                    "Lesson 6",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "щасливий", ToJsonStringArray("happy", "table", "dog"), "happy", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("big", "великий"),
                    ("small", "малий"),
                    ("hot", "гарячий"),
                    ("cold", "холодний")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "The water is ___ . (Вода холодна)", "{}", "cold", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "This is a ___ house.", ToJsonStringArray("big", "eat", "run"), "big", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("good", "добрий"),
                    ("bad", "поганий"),
                    ("new", "новий"),
                    ("old", "старий")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "This is a ___ car. (Це нова машина)", "{}", "new", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "I feel ___ .", ToJsonStringArray("tired", "chair", "pen"), "tired", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("happy", "щасливий"),
                    ("sad", "сумний"),
                    ("tired", "втомлений"),
                    ("angry", "злий")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "I am ___ . (Я щасливий/щаслива)", "{}", "happy", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Basic words",
                    "Lesson 7",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "на", ToJsonStringArray("on", "run", "eat"), "on", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("on", "на"),
                    ("in", "в"),
                    ("under", "під"),
                    ("near", "біля")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "The cat is ___ the table. (Кіт під столом)", "{}", "under", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "The pen is ___ the bag.", ToJsonStringArray("in", "sleep", "big"), "in", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("here", "тут"),
                    ("there", "там"),
                    ("left", "ліворуч"),
                    ("right", "праворуч")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "The dog is ___ the house. (Собака біля будинку)", "{}", "near", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "The book is ___ the box.", ToJsonStringArray("under", "drink", "happy"), "under", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("above", "над"),
                    ("below", "під"),
                    ("inside", "всередині"),
                    ("outside", "ззовні")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "The apple is ___ the table. (Яблуко на столі)", "{}", "on", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Basic words",
                    "Lesson 8",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "прокидатися", ToJsonStringArray("wake up", "chair", "table"), "wake up", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("wake up", "прокидатися"),
                    ("eat", "їсти"),
                    ("drink", "пити"),
                    ("sleep", "спати")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I ___ water. (Я п’ю воду)", "{}", "drink", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "I ___ breakfast.", ToJsonStringArray("eat", "run", "cold"), "eat", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("go", "йти"),
                    ("come", "приходити"),
                    ("play", "грати"),
                    ("work", "працювати")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "I ___ to school. (Я йду до школи)", "{}", "go", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "I ___ football.", ToJsonStringArray("play", "table", "door"), "play", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("morning", "ранок"),
                    ("day", "день"),
                    ("evening", "вечір"),
                    ("night", "ніч")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "I sleep at ___. (Я сплю вночі)", "{}", "night", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Simple sentences",
                    "Present Simple: I / you",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "I ___ coffee.", ToJsonStringArray("drink", "chair", "big"), "drink", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("I eat", "я їм"),
                    ("I drink", "я п’ю"),
                    ("I read", "я читаю"),
                    ("I play", "я граю")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I ___ a book. (Я читаю книгу)", "{}", "read", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "You ___ very fast.", ToJsonStringArray("run", "table", "cold"), "run", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("I work", "я працюю"),
                    ("I sleep", "я сплю"),
                    ("I go", "я йду"),
                    ("I come", "я приходжу")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "You ___ water. (Ти п’єш воду)", "{}", "drink", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "I ___ every day.", ToJsonStringArray("work", "apple", "chair"), "work", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("you eat", "ти їси"),
                    ("you drink", "ти п’єш"),
                    ("you read", "ти читаєш"),
                    ("you play", "ти граєш")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "I ___ to school. (Я йду до школи)", "{}", "go", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Simple sentences",
                    "Present Simple: he / she",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "He ___ coffee.", ToJsonStringArray("drink", "drinks", "drinking"), "drinks", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("he eats", "він їсть"),
                    ("she drinks", "вона п’є"),
                    ("he reads", "він читає"),
                    ("she plays", "вона грає")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "He ___ a book. (Він читає книгу)", "{}", "reads", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "She ___ every day.", ToJsonStringArray("run", "runs", "running"), "runs", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("he works", "він працює"),
                    ("she sleeps", "вона спить"),
                    ("he goes", "він йде"),
                    ("she comes", "вона приходить")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "She ___ water. (Вона п’є воду)", "{}", "drinks", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "He ___ football.", ToJsonStringArray("play", "plays", "playing"), "plays", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("he runs", "він біжить"),
                    ("she eats", "вона їсть"),
                    ("he drinks", "він п’є"),
                    ("she reads", "вона читає")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "He ___ to school. (Він йде до школи)", "{}", "goes", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Simple sentences",
                    "Negative: I / you — don’t",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "I ___ like coffee.", ToJsonStringArray("don’t", "doesn’t", "not"), "don’t", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("I don’t eat", "я не їм"),
                    ("I don’t drink", "я не п’ю"),
                    ("I don’t read", "я не читаю"),
                    ("I don’t play", "я не граю")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I ___ like milk. (Я не люблю молоко)", "{}", "don’t", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "You ___ work today.", ToJsonStringArray("don’t", "doesn’t", "not"), "don’t", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("you don’t go", "ти не йдеш"),
                    ("you don’t sleep", "ти не спиш"),
                    ("you don’t work", "ти не працюєш"),
                    ("you don’t come", "ти не приходиш")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "You ___ eat meat. (Ти не їси м’ясо)", "{}", "don’t", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "I ___ play football.", ToJsonStringArray("don’t", "doesn’t", "no"), "don’t", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("I don’t like", "я не люблю"),
                    ("you don’t drink", "ти не п’єш"),
                    ("I don’t go", "я не йду"),
                    ("you don’t read", "ти не читаєш")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "I ___ go to school. (Я не йду до школи)", "{}", "don’t", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Simple sentences",
                    "Negative: he / she — doesn’t",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "He ___ like coffee.", ToJsonStringArray("don’t", "doesn’t", "not"), "doesn’t", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("he doesn’t eat", "він не їсть"),
                    ("she doesn’t drink", "вона не п’є"),
                    ("he doesn’t read", "він не читає"),
                    ("she doesn’t play", "вона не грає")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "He ___ like milk. (Він не любить молоко)", "{}", "doesn’t", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "She ___ work today.", ToJsonStringArray("don’t", "doesn’t", "not"), "doesn’t", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("he doesn’t go", "він не йде"),
                    ("she doesn’t sleep", "вона не спить"),
                    ("he doesn’t work", "він не працює"),
                    ("she doesn’t come", "вона не приходить")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "She ___ eat meat. (Вона не їсть м’ясо)", "{}", "doesn’t", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "He ___ play football.", ToJsonStringArray("don’t", "doesn’t", "no"), "doesn’t", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("he doesn’t like", "він не любить"),
                    ("she doesn’t drink", "вона не п’є"),
                    ("he doesn’t go", "він не йде"),
                    ("she doesn’t read", "вона не читає")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "He ___ go to school. (Він не йде до школи)", "{}", "doesn’t", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Simple sentences",
                    "Questions: Do you…?",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "___ you like coffee?", ToJsonStringArray("Do", "Does", "Are"), "Do", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Do you eat?", "Ти їси?"),
                    ("Do you drink?", "Ти п’єш?"),
                    ("Do you read?", "Ти читаєш?"),
                    ("Do you play?", "Ти граєш?")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "___ you go to school? (Ти йдеш до школи?)", "{}", "Do", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "___ you work today?", ToJsonStringArray("Do", "Does", "Is"), "Do", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Do you go?", "Ти йдеш?"),
                    ("Do you sleep?", "Ти спиш?"),
                    ("Do you work?", "Ти працюєш?"),
                    ("Do you come?", "Ти приходиш?")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "___ you like apples? (Ти любиш яблука?)", "{}", "Do", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "___ you play football?", ToJsonStringArray("Do", "Does", "Are"), "Do", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Do you like?", "Ти любиш?"),
                    ("Do you drink?", "Ти п’єш?"),
                    ("Do you go?", "Ти йдеш?"),
                    ("Do you read?", "Ти читаєш?")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "___ you read books? (Ти читаєш книги?)", "{}", "Do", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Simple sentences",
                    "Short answers: Yes / No",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "Do you like coffee? — Yes, I ___ .", ToJsonStringArray("do", "am", "is"), "do", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Yes, I do", "Так, я люблю"),
                    ("No, I don’t", "Ні, я не люблю"),
                    ("Yes, I do", "Так, я читаю"),
                    ("No, I don’t", "Ні, я не читаю")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "Do you read? — Yes, I ___ .", "{}", "do", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "Do you drink milk? — No, I ___ .", ToJsonStringArray("don’t", "doesn’t", "not"), "don’t", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Yes, I do", "Так, я п’ю"),
                    ("No, I don’t", "Ні, я не п’ю"),
                    ("Yes, I do", "Так, я йду"),
                    ("No, I don’t", "Ні, я не йду")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "Do you work? — No, I ___ .", "{}", "don’t", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "Do you play football? — Yes, I ___ .", ToJsonStringArray("do", "am", "is"), "do", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Yes, I do", "Так, я граю"),
                    ("No, I don’t", "Ні, я не граю"),
                    ("Yes, I do", "Так, я працюю"),
                    ("No, I don’t", "Ні, я не працюю")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "Do you eat apples? — Yes, I ___ .", "{}", "do", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Simple sentences",
                    "Questions: Does he / she…?",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "___ he like coffee?", ToJsonStringArray("Do", "Does", "Is"), "Does", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Does he eat?", "Він їсть?"),
                    ("Does she drink?", "Вона п’є?"),
                    ("Does he read?", "Він читає?"),
                    ("Does she play?", "Вона грає?")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "___ she go to school? (Вона йде до школи?)", "{}", "Does", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "___ he work today?", ToJsonStringArray("Do", "Does", "Are"), "Does", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Does he go?", "Він йде?"),
                    ("Does she sleep?", "Вона спить?"),
                    ("Does he work?", "Він працює?"),
                    ("Does she come?", "Вона приходить?")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "___ he like apples? (Він любить яблука?)", "{}", "Does", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "___ she play football?", ToJsonStringArray("Do", "Does", "Is"), "Does", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Does he like?", "Він любить?"),
                    ("Does she drink?", "Вона п’є?"),
                    ("Does he go?", "Він йде?"),
                    ("Does she read?", "Вона читає?")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "___ she read books? (Вона читає книги?)", "{}", "Does", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Simple sentences",
                    "Short answers: he / she",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "Does he like coffee? — Yes, he ___ .", ToJsonStringArray("do", "does", "is"), "does", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Yes, he does", "Так, він любить"),
                    ("No, he doesn’t", "Ні, він не любить"),
                    ("Yes, she does", "Так, вона любить"),
                    ("No, she doesn’t", "Ні, вона не любить")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "Does she read? — Yes, she ___ .", "{}", "does", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "Does he drink milk? — No, he ___ .", ToJsonStringArray("don’t", "doesn’t", "not"), "doesn’t", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Yes, he does", "Так, він працює"),
                    ("No, he doesn’t", "Ні, він не працює"),
                    ("Yes, she does", "Так, вона читає"),
                    ("No, she doesn’t", "Ні, вона не читає")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "Does she work? — No, she ___ .", "{}", "doesn’t", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "Does he play football? — Yes, he ___ .", ToJsonStringArray("do", "does", "is"), "does", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Yes, he does", "Так, він грає"),
                    ("No, he doesn’t", "Ні, він не грає"),
                    ("Yes, she does", "Так, вона п’є"),
                    ("No, she doesn’t", "Ні, вона не п’є")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "Does he eat apples? — Yes, he ___ .", "{}", "does", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Travel",
                    "At the airport",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "Airport", ToJsonStringArray("Аеропорт", "Готель", "Квиток"), "Аеропорт", 1),
                new ExerciseSeed(ExerciseType.Input, "Write English: паспорт", "{}", "passport", 2),
                new ExerciseSeed(ExerciseType.MultipleChoice, "Ticket", ToJsonStringArray("Квиток", "Ключ", "Меню"), "Квиток", 3),
                new ExerciseSeed(ExerciseType.Input, "Write Ukrainian for: passport", "{}", "паспорт", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("airport", "аеропорт"),
                    ("ticket", "квиток"),
                    ("passport", "паспорт")
                ), "{}", 5)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Travel",
                    "Asking directions",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "Turn left", ToJsonStringArray("Поверніть ліворуч", "Поверніть праворуч", "Йдіть прямо"), "Поверніть ліворуч", 1),
                new ExerciseSeed(ExerciseType.Input, "Write English: Йдіть прямо", "{}", "Go straight", 2),
                new ExerciseSeed(ExerciseType.MultipleChoice, "Where is ...?", ToJsonStringArray("Де ...?", "Скільки коштує?", "Котра година?"), "Де ...?", 3),
                new ExerciseSeed(ExerciseType.Input, "Write Ukrainian for: Turn right", "{}", "Поверніть праворуч", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the phrases", ToJsonMatchPairs(
                    ("Turn left", "Поверніть ліворуч"),
                    ("Turn right", "Поверніть праворуч"),
                    ("Go straight", "Йдіть прямо")
                ), "{}", 5)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Food & Cafe",
                    "In a cafe",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "Coffee", ToJsonStringArray("Кава", "Чай", "Вода"), "Кава", 1),
                new ExerciseSeed(ExerciseType.Input, "Write Ukrainian for: menu", "{}", "меню", 2),
                new ExerciseSeed(ExerciseType.MultipleChoice, "Bill", ToJsonStringArray("Рахунок", "Квиток", "Ключ"), "Рахунок", 3),
                new ExerciseSeed(ExerciseType.Input, "Write English: Чай", "{}", "Tea", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("coffee", "кава"),
                    ("tea", "чай"),
                    ("menu", "меню"),
                    ("bill", "рахунок")
                ), "{}", 5)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Food & Cafe",
                    "How much is it?",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "How much is it?", ToJsonStringArray("Скільки коштує?", "Де ти?", "Котра година?"), "Скільки коштує?", 1),
                new ExerciseSeed(ExerciseType.Input, "Write English: Це коштує 5", "{}", "It is 5", 2),
                new ExerciseSeed(ExerciseType.MultipleChoice, "Cheap", ToJsonStringArray("Дешевий", "Дорогий", "Відкрито"), "Дешевий", 3),
                new ExerciseSeed(ExerciseType.Input, "Write English: Дорогий", "{}", "Expensive", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("price", "ціна"),
                    ("cheap", "дешевий"),
                    ("expensive", "дорогий")
                ), "{}", 5)
                    }
                )
            };
        }

        private static string ToJsonStringArray(params string[] items)
        {
            return JsonSerializer.Serialize(items.ToList());
        }

        private static string ToJsonMatchPairs(params (string Left, string Right)[] pairs)
        {
            var data = pairs
                .Select(x => new MatchPairSeed { left = x.Left, right = x.Right })
                .ToList();

            return JsonSerializer.Serialize(data);
        }

        private class MatchPairSeed
        {
            public string left { get; set; } = null!;
            public string right { get; set; } = null!;
        }
    }

    public record CourseSeed(string Title, string Description, string LanguageCode, bool IsPublished, string? Level, int Order);

    public record SceneStepSeed(
        int Order,
        string Speaker,
        string Text,
        string StepType,
        string? MediaUrl = null,
        string? ChoicesJson = null);

    public record TopicSeed(string Title, int Order);

    public record LessonSeed(int TopicId, string Title, string Theory, int Order);

    public record ExerciseSeed(ExerciseType Type, string Question, string Data, string CorrectAnswer, int Order, string? ImageUrl = null);

    public record LessonExerciseSeed(string TopicTitle, string LessonTitle, List<ExerciseSeed> Exercises);
}
