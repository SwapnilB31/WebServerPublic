public class test {

    class ExA extends Exception {

    }

    class ExB extends ExA {

    }
    public static void main(String args[]) {
        for(int i = 1; i < args.length; i++) {
            System.out.print(i+" " );
        }
        /*try {
            throw new ExA();
        } catch(Exception ex) {
            System.out.print("ExA caught");
        }
        catch(ExA ex) {
            System.out.print("Exception caught");
        }*/
    }
}